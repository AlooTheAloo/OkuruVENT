import { app, BrowserWindow, dialog, Notification, shell } from "electron";
import { existsSync, appendFileSync, rmSync, writeFileSync } from "original-fs";
import { sep } from "path";
import { Socket } from "socket.io";
import { getHostName } from "./devices";
import { EventEmitter } from "events";
import { Transfer } from "@shared/misc";
let transfers:Transfer[] = [];
let shownNotification:Notification;

export default { createModuleForServer }

export const eventHandler = new EventEmitter(); 

/**
 * The 'Constructor' of fileReceive, creates a file receiver for the server accept incoming file transfers
 * @param {Socket} socket the server socket
 * @param {BrowserWindow} mainwindow  the electron window to send notifications to
 * @returns {void}
 */
export function createModuleForServer(socket:Socket, mainwindow:BrowserWindow):void{
    
    eventHandler.on(`Application:DisconnectSocket:${socket.id}`, function handler (){
        socket.disconnect();
        socket.offAny();
        eventHandler.removeListener(`Application:DisconnectSocket:${socket.id}`, handler);
    })



    // Ask for transfer
    socket.on("Transfer:RequestFileTransfer", (filename:string, hostname:string, transferID:string, fileSize:number) =>{
        // Notification
        shownNotification = new Notification({
            title: `${hostname} wants to share ${filename} with you.`,
            body: `Click here to accept or refuse it.`,
        });
        shownNotification.show();
        shownNotification.on("click", () => { 

            dialog.showSaveDialog(mainwindow, {
                defaultPath: app.getPath("downloads") + sep + filename,
            }).then((res) => {
                if(res.canceled){
                    socket.emit("ACK:Transfer:FileRequestTransfer", transferID, false, getHostName());
                }
                else{
                    if(res.filePath == null) return;
                    console.log("1");

                    // Set in arr
                    transfers.push({id:transferID, 
                        filepath:res.filePath, 
                        lastKnownSpeed: "-",
                        socketID:socket.id, 
                        filename:res.filePath.split(sep)[res.filePath.split(sep).length - 1],
                        fileSize : fileSize,
                        progress : 0
                    
                    });
                    console.log(JSON.stringify(transfers[transfers.length - 1]));                    
                    // Reply
                    socket.emit("ACK:Transfer:FileRequestTransfer", transferID, true, getHostName());
                }
            })
            
        });
    })   


    socket.on("Transfer:FileTransferComplete", (fileTransferID) => {
        console.log(`Transfer ${fileTransferID} is completed!`)
        const transfer = transfers.filter(x => x.id == fileTransferID)[0]; 
        transfers = transfers.filter(x => x.id != fileTransferID); // Remove transfer
        shownNotification = new Notification(
            {
                title:"File transfer completed !!",
                body:"Click here to open the file in the explorer"
            }
        )
        shownNotification.on("click", () => { // Clicked on noti, let's open filepath
            shell.showItemInFolder(transfer.filepath)
        });
        shownNotification.show();
    })

    socket.on("Transfer:FileTransferPacket", (fileTransferID, unixMSTimeStamp, dataPacketSize, packetID, positionBytes, completed:boolean, data, fileSize) => {
        const targetTransfer = transfers.filter(x => x.id == fileTransferID)[0];

        
        if(packetID == 0) {
            if(existsSync( targetTransfer.filepath)){
                rmSync(targetTransfer.filepath);
            }
            writeFileSync(targetTransfer.filepath, data)
        }
        else{
            appendFileSync(targetTransfer.filepath, data);
        }

        socket.emit("ACK:Transfer:FileTransferPacket", fileTransferID, unixMSTimeStamp, packetID + 1, positionBytes + dataPacketSize, dataPacketSize, fileSize); 
        
    });

}
