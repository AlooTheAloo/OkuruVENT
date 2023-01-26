// Server is the entrypoint from index; it shouldn't export anything
export default {};

// Libs
import { app, ipcMain } from "electron";
import { Server, Socket } from "socket.io";
import { BrowserWindow } from "electron";
import { hostname } from "os";
import { sep } from "path";

// Modules
import {
  discovType,
  netDiscov,
  SendPeersToRenderer,
  SendPeersToRenderer as UpdatePeers,
  setDiscovType,
} from "./modules/netdiscovery"; // Network scanning module
import {
  createModuleForServer as createServerModule,
  updateFilesReceive,
} from "./modules/fileReceive";
import { port } from "./modules/constants";
import { rpcInvoke } from "../rpc";
import { createApp } from "./modules/generateApp";
import { DiscoveryType, Page } from "@shared/misc";
import { existsSync } from "original-fs";
import {
  addFriend,
  blockPeer,
  canBeDiscoveredBy,
  getBlocked,
  getFriendPK,
  getFriends,
  getHostName,
  getPublicKey,
  isFriend,
  removeFriend,
  unBlock,
} from "./modules/devices";
import { createVerify, randomBytes } from "crypto";

// Server Vars
const server = new Server(port, {
  pingInterval: 2000,
  pingTimeout: 6000,
  transports: ["websocket"],
  maxHttpBufferSize: 1e25,
});
export const appDataPath = app.getPath("userData") + sep;

// Client vars stored here
export let currentPage = Page.None;

// Global non-garbage collected variables
let mainWindow: BrowserWindow | undefined = undefined;

let clientRecords: { friendID: string; socketID: string }[] = [];
/**
 *
 * @param nonFriendsOnly If true, gives only non friends, if false gives everyone
 * @returns The sockets you want
 */
export function getSockets(): { Socket: Socket; friendID: string }[] {
  let arr: { Socket: Socket; friendID: string }[] = [];
  for (const [_, socket] of server.of("/").sockets) {
    arr.push({
      Socket: socket,
      friendID: clientRecords.filter(x => x.socketID == socket.id)[0].friendID,
    });
  }
  return arr;
}

server.disconnectSockets();
server.on("connection", (socket: Socket) => {
  if (mainWindow == undefined || mainWindow == null) {
    socket.disconnect();
    return;
  }

  if (typeof socket.handshake.query["friendID"] != "string") {
    socket.disconnect();
    return;
  }
  if (typeof socket.handshake.query["hostName"] != "string") {
    socket.disconnect();
    return;
  }

  let dataToSign = "";
  let friendID = socket.handshake.query["friendID"];

  if (!canBeDiscoveredBy(socket.handshake.query["friendID"])) {
    socket.disconnect(); // can't be discovered
    return;
  } else {
    // this device is saying that they are a friend, we need to verify this claim
    if (
      isFriend(
        socket.handshake.query["friendID"],
        socket.handshake.query["hostName"],
      )
    ) {
      // We ask them to sign
      dataToSign = randomBytes(100).toString();
      socket.emit("Security:SignRequest", dataToSign);
    } else {
      socket.emit("Security:confirm_connection", getPublicKey());
    }
  }

  socket.on("Security:ACK:SignRequest", (signature: string) => {
    const verify = createVerify("SHA256");
    verify.write(dataToSign);
    verify.end();
    if (verify.verify(getFriendPK(friendID), signature, "hex")) {
      socket.emit("Security:confirm_connection", getPublicKey());
    } else {
      // IMPOSTOR DETECTED!!!
      console.log(
        `Spoofing has been discovered on the network by peer ${socket.handshake.query["hostName"]}. Please take caution.`,
      );
      socket.disconnect();
    }
  });

  clientRecords.push({
    friendID: socket.handshake.query["friendID"],
    socketID: socket.id,
  });
  createServerModule(socket, mainWindow);

  socket.on("disconnect", (reason: string) => {
    clientRecords = clientRecords.filter(x => x.socketID != socket.id);
  });
});

ipcMain.handle("Application:PeerDisconnect", () => {
  server.disconnectSockets();
});

ipcMain.handle("Application:Require:PeersUpdate", () => {
  UpdatePeers();
});
ipcMain.handle("Application:Require:DeviceName", () => {
  rpcInvoke("Application:DeviceName", hostname());
});
ipcMain.handle(
  "Application:StartPage:SendHostName",
  (evt: Event, chosenHostname: string) => {
    createApp(appDataPath, chosenHostname);
    rpcInvoke("Application:ChangePage", Page.AppPage);
    currentPage = Page.AppPage;
  },
);

ipcMain.handle("Application:Require:ApplicationHasBeenSetup", () => {
  const setup = existsSync(`${appDataPath}User${sep}`);
  if (setup) {
    rpcInvoke("Application:ChangePage", Page.AppPage);
    currentPage = Page.AppPage;
  } else {
    rpcInvoke("Application:ChangePage", Page.StartPage);
    currentPage = Page.StartPage;
  }
});

ipcMain.handle("Application:Require:HostName", () => {
  rpcInvoke("Application:HostName", getHostName());
});

ipcMain.handle("Application:addAsFriend", (evt: Event, peerString: string) => {
  addFriend(JSON.parse(peerString));
  SendPeersToRenderer();
});

ipcMain.handle("Application:removeFriend", (evt: Event, friendID: string) => {
  removeFriend(friendID);
  SendPeersToRenderer();
});

ipcMain.handle("Application:BlockPeer", (evt: Event, peerString: string) => {
  blockPeer(JSON.parse(peerString));
});

ipcMain.handle(
  "Application:Set:DiscoveryType",
  (evt: Event, newType: DiscoveryType) => {
    setDiscovType(newType);
  },
);

ipcMain.handle("Application:Require:FriendsList", (evt: Event) => {
  rpcInvoke("Application:FriendsList", getFriends());
});

ipcMain.handle("Application:Require:DiscoveryType", (evt: Event) => {
  rpcInvoke("Application:DiscoveryType", discovType);
});

ipcMain.handle("Application:Require:BlockedList", (evt: Event) => {
  rpcInvoke("Application:BlockedList", getBlocked());
});

ipcMain.handle("Application:unfriend", (evt: Event, friendID: string) => {
  removeFriend(friendID);
  rpcInvoke("Application:FriendsList", getFriends());
});

ipcMain.handle("Application:unblock", (evt: Event, friendID: string) => {
  unBlock(friendID);
  rpcInvoke("Application:BlockedList", getBlocked());
});

ipcMain.handle("Application:Require:IncomingTransfers", () => {
  updateFilesReceive();
});

/**
 *  @param { BrowserWindow } win the electron window to send notifications to
 *  @returns { void }
 */
export function startNetDiscovery(win: BrowserWindow): void {
  mainWindow = win;
  setInterval(() => {
    netDiscov(win); // Discover peers every 10000 ms
  }, 5000);
}
