import { app, BrowserWindow, dialog, Notification, shell } from "electron";
import { existsSync, appendFileSync, rmSync, writeFileSync } from "original-fs";
import { sep } from "path";
import { Socket } from "socket.io";
const os = require("os")
let transfers:{id:string, filepath:string}[] = [];
let shownNotification:Notification;

export default { createModuleForServer }

/**
 * The 'Constructor' of fileReceive, creates a file receiver for the server accept incoming file transfers
 * @param {Socket} socket the server socket
 * @param {BrowserWindow} mainwindow  the electron window to send notifications to
 * @returns {void}
 */
export function createModuleForServer(socket:Socket, mainwindow:BrowserWindow):void{
    
    // Ask for transfer
    socket.on("Transfer:RequestFileTransfer", (filename:string, hostname:string, transferID:string) =>{
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
                    socket.emit("ACK:Transfer:FileRequestTransfer", transferID, false, os.hostname());
                }
                else{
                    if(res.filePath == null) return;
                    // Set in arr
                    transfers.push({id:transferID, filepath:res.filePath});
                    // Reply
                    socket.emit("ACK:Transfer:FileRequestTransfer", transferID, true, os.hostname());
                    transfers.push({id: transferID, filepath: res.filePath });
                }
            })
            
        });
    })   


    socket.on("Transfer:FileTransferComplete", (fileTransferID) => {
        console.log(`Transfer ${fileTransferID} is completed!`)
        const transfer = transfers.filter(x => x.id == fileTransferID)[0]; 
        transfers = transfers.filter(x => x.id != fileTransferID);
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
