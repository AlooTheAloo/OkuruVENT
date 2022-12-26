// Server is the entrypoint from index; it shouldn't export anything 
export default {}

// Libs
import { ipcMain } from "electron";
import { Server, Socket } from "socket.io";
import { BrowserWindow } from 'electron';
import { hostname } from 'os';
// Modules
import { netDiscov, SendPeersToRenderer as UpdatePeers } from './modules/netdiscovery'; // Network scanning module
import { createModuleForServer as fileReceive } from "./modules/fileReceive";
import { port } from "./modules/constants";
import { rpcInvoke } from "../rpc";

// Server Vars
const server = new Server(port, {pingInterval:2000, pingTimeout:6000, transports: ['websocket'], maxHttpBufferSize: 1e25});

// Global non-garbage collected variables
let mainWindow:BrowserWindow|undefined = undefined;

server.disconnectSockets();
server.on("connection", (socket:Socket) => { 
  if(mainWindow == undefined || mainWindow == null) { socket.disconnect(); return; } 
  fileReceive(socket, mainWindow);
})

// Temporary test function to eject all peers from your network
ipcMain.handle('Application:PeerDisconnect', () => {
  server.disconnectSockets();
})

ipcMain.handle("Application:Require:PeersUpdate", () => {
  UpdatePeers();
})
ipcMain.handle("Application:Require:DeviceName", () => {
  rpcInvoke("Application:DeviceName", hostname());
}) 
/**
 *  @param { BrowserWindow } win the electron window to send notifications to
 *  @returns { void }
 */
export function startNetDiscovery(win:BrowserWindow): void{
  mainWindow = win;
  setInterval(() => {
    netDiscov(win) // Discover peers every 5000 ms
  }, 5000);
}

