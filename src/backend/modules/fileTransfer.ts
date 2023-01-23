import { Transfer } from '@shared/misc';
import { ipcMain, dialog, Notification, BrowserWindow } from 'electron';
import fs from 'fs';
import { PathLike } from 'original-fs';
import { Socket } from 'socket.io';
import { getHostName } from './devices';
import { addToHistoryFile } from './history';

let currentNotification:Notification;

let currentAwaitingSenderTransfers:Transfer[] = [];
let currentSenderTransfers:Transfer[] = [];




export default { createModuleForClient }

/**
 * The 'constructor' for fileTransfer, generates all handlers for future transfers to this client
 * @param {Socket} socket The socket of this client
 * @param {BrowserWindow} mainWindow The electron window to send notifications to 
*/
export function createModuleForClient(socket:Socket, mainwindow:BrowserWindow){

    // Create handler for this client
    ipcMain.handle("Application:FileTransfer:RequestFileTransfer:" + socket.id, (evt, ) =>{
        dialog.showOpenDialog(mainwindow, {}).then((res) => {
            if(res.canceled){ return; }
            else{
                let transferID = makeid(50);
                var filename = res.filePaths[0].replace(/^.*[\\\/]/, '')
                const size = getSize(res.filePaths[0]);
                currentAwaitingSenderTransfers.push (
                    { filename:filename, 
                        id:transferID, 
                        lastKnownSpeed:"-" , 
                        filepath:res.filePaths[0], 
                        socketID:socket.id,
                        fileSize: size,
                        progress: 0,
                        hostname: ""
                    });
                console.log(currentAwaitingSenderTransfers.length)
                socket.emit("Transfer:RequestFileTransfer", filename, getHostName(), transferID, size);
            } 
        })
        
    })

    socket.on("ACK:Transfer:FileRequestTransfer", (fileTransferID, accepted, hostname) => {
        let targetTransfer = currentAwaitingSenderTransfers.find(x => x.id == fileTransferID);
        if(targetTransfer == null){
            console.log("Your transfer somehow got accepted by someone you didn't ask to transfer to. Interesting.")
            return;
        }
        targetTransfer.hostname = hostname;
        currentAwaitingSenderTransfers = currentAwaitingSenderTransfers
        .filter(x => x.id != fileTransferID);
        if(accepted){
            currentNotification = new Notification({
                title: "File transfer request accepted!",
                body: `${hostname} accepted your file transfer!`
              });   
            currentNotification.show();
            currentSenderTransfers.push(targetTransfer);
            SendPacket(fileTransferID, Date.now(), 0, 0, 0, socket);
        }
        else{
            // create non-garbage collected notification
            currentNotification = new Notification({
                title: "File request denied!",
                body: `${hostname} denied your file transfer!`
              });   
            currentNotification.show();
        }
    })

    socket.on("ACK:Transfer:FileTransferPacket", (fileTransferID, unixMSTimeStamp, packetID, positionBytes, size, fileSize) =>{
        if(positionBytes * 1e6 < fileSize){
            SendPacket(fileTransferID, unixMSTimeStamp, packetID, positionBytes, size, socket);
        }
        else{
            const transfer:Transfer = currentSenderTransfers.filter(x => x.id == fileTransferID)[0] // get transfer
            currentSenderTransfers = currentSenderTransfers.filter(x => x.id != fileTransferID) // Remove transfer
            socket.emit("Transfer:FileTransferComplete", fileTransferID);
            addToHistoryFile({
                hostname:transfer.hostname,
                filename:transfer.filename,
                fileSize:transfer.fileSize,
                isReceived:false,
                date:new Date()
            });
        }
    })
}

/**
 * Sends a packet to the connected client
 * @param {String} fileTransferID The ID of the file transfer we are sending with
 * @param {number} unixMSTimeStamp The time at which we are sending the data
 * @param {number} packetID The number of the packet we are sending, starting at 0
 * @param {number} size The latest packet's size. 0 if this is the first packet
 * @param {Socket} socket The socket to send the packet to
 * 
*/
function SendPacket(fileTransferID:string, unixMSTimeStamp:number, packetID:number, positionBytes, size: number, socket: Socket){
    console.log("Sending packet #" + packetID);
    let targetTransfer = currentSenderTransfers.find(x => x.id == fileTransferID);
    if(targetTransfer == null || targetTransfer == undefined ){
        console.log("Someone requested a file you haven't shared with them. Interesting.");
        return;
    }

    let targetMB = 0; // How many MBs in one packet, we try to get < 5000 MS per packet. 
    if(packetID != 0){
        let time = (Date.now() - unixMSTimeStamp);
        const [target, speed] = calculateNextPacketSize(size, time, targetTransfer)
        targetMB = target;
        targetTransfer.lastKnownSpeed = speed;     
        console.log(JSON.stringify(targetTransfer));
    }
    else{
        targetMB = 1; // First transfer, 1 MB
    }
    if(targetMB == 0) targetMB = 1; // 0 MB packets are not very productive
    targetMB = Math.ceil(targetMB); // Eliminate any sign of decimal numbers, they make manipulations real dirty


    // Create packet
    let Buf = Buffer.alloc(1e6 * targetMB);
    if(targetTransfer == undefined) return; // No transfer
    fs.open(targetTransfer.filepath, 'r', (status, fd) => { // Open target file
        if (status) { // Error
            console.log(status.message);
            return;
        }

        if(targetTransfer == undefined) return; // TS is weird
        let fileSize = getSize(targetTransfer.filepath); // Get the size of the file
        if ((positionBytes * 1e6) + (targetMB * 1e6) > fileSize){ // Last packet too large
            const dlSize = (fileSize) - (positionBytes * 1e6);
            Buf = Buffer.alloc(dlSize); // Create new buffer because current allocation is too large
            fs.readSync(fd, Buf, 0, dlSize, positionBytes * 1e6) // Read the file
        }
        else{
            fs.readSync(fd, Buf, 0, targetMB * 1e6, positionBytes * 1e6); // Read the file
        }
        
        fileSize = fs.statSync(targetTransfer.filepath).size ;
        socket.emit("Transfer:FileTransferPacket", fileTransferID, Date.now(), targetMB, packetID, positionBytes, false, Buf, fileSize); // Send packet
    })
}

/**
 * Calculates the next transfer packet size
 * @param {number} lastSize the last transfer's size in MB
 * @param {number} lastTime the last transfer's time in ms
 * @returns {[number, string]} however much data we should send in the next packet, the last known speed
 */
function calculateNextPacketSize(lastSize:number, lastTime:number, targetTransfer:Transfer):[number, string]{ 
    let mb = lastSize / lastTime * 1000;
    const lastKnownSpeed = (Math.round(mb * 100) / 100).toString();
    if(lastTime >= 10000){
        return [Math.floor(lastSize / 2), lastKnownSpeed]; // Let's go MUCH slower. 
    }
    else if(lastTime >= 4500){
        return [Math.floor(lastSize / 1.2), lastKnownSpeed]; // lets go slower. 
    }
    else if (lastTime < 4000){
        return [lastSize * 1.2, lastKnownSpeed]; // Let's go faster
    }
    else{
        return [lastSize, lastKnownSpeed];
    }
}



/**
 * Creates ID for file transfers
 * @param {number} length - Length of ID.
 * @returns {string} The file transfer ID that was created
 */
function makeid(length:number): string {
    var result           = ''; 
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * Finds size in bytes of file
 * @param {PathLike} filename The path of the file to read
 * @returns {number} The size of the file in parameters
 */
function getSize(filename:PathLike):number{
    return fs.statSync(filename).size;
}