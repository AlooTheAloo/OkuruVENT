// Server is the entrypoint from index; it shouldn't export anything 
export default {}

// Libs
import { app, ipcMain } from "electron";
import { Server, Socket } from "socket.io";
import { BrowserWindow } from 'electron';
import { hostname } from 'os';
import { sep } from 'path';

// Modules
import { netDiscov, SendPeersToRenderer, SendPeersToRenderer as UpdatePeers } from './modules/netdiscovery'; // Network scanning module
import { createModuleForServer as createServerModule } from "./modules/fileReceive";
import { port } from "./modules/constants";
import { rpcInvoke } from "../rpc";
import { createApp } from "./modules/generateApp";
import { Page } from "@shared/misc";
import { existsSync } from "original-fs";
import { addFriend, getHostName, removeFriend } from "./modules/helper";

// Server Vars
const server = new Server(port, {pingInterval:2000, pingTimeout:6000, transports: ['websocket'], maxHttpBufferSize: 1e25});
export const appDataPath = app.getPath('userData') + sep;

// Client vars stored here
export let currentPage = Page.None; 

// Global non-garbage collected variables
let mainWindow:BrowserWindow|undefined = undefined;

server.disconnectSockets();
server.on("connection", (socket:Socket) => { 
  if(mainWindow == undefined || mainWindow == null) { socket.disconnect(); return; } 
  createServerModule(socket, mainWindow);
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
ipcMain.handle("Application:StartPage:SendHostName", (evt:Event, chosenHostname:string) => {
  createApp(appDataPath, chosenHostname);
  rpcInvoke("Application:ChangePage", Page.MainPage);
  currentPage = Page.MainPage;
})

ipcMain.handle("Application:Require:ApplicationHasBeenSetup", () => {
  const setup = existsSync(`${appDataPath}User${sep}`);
  if(setup) { rpcInvoke("Application:ChangePage", Page.MainPage); currentPage = Page.MainPage }
  else { rpcInvoke("Application:ChangePage", Page.StartPage); currentPage = Page.StartPage }
});

ipcMain.handle("Application:Require:HostName", () =>{
  rpcInvoke("Application:HostName", getHostName())
})

ipcMain.handle("Application:addAsFriend", (evt:Event, hostname:string, friendID:string) =>{
  addFriend(friendID, hostname);
  SendPeersToRenderer();
})

ipcMain.handle("Application:removeFriend", (evt:Event, friendID:string) =>{
  removeFriend(friendID);
  SendPeersToRenderer();
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

