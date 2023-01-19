
// SERVER SIDE PEER DISCOVERY 
// SELF --> PEERS
import dgram from 'dgram';
const { io } = require("socket.io-client");
import { createModuleForClient as fileTransfer } from "./fileTransfer"
import os from "os";
import { rpcInvoke } from "../../rpc";
import { app, BrowserWindow } from "electron";
import { port } from "./constants";
import { DeviceType, DiscoveryType, Page, Peer } from '@shared/misc';
import { disconnectEveryone, disconnectNonFriends, getHostID, getHostName, getPrivateKey, isFriend } from './devices';
import { currentPage } from '../server';
import { createPrivateKey, createSign } from 'crypto';
import { Socket } from 'socket.io';
import { setSelectedRadio } from '../../index';


// Connected peers
export let peers:Peer[] = [];
export let discovType:DiscoveryType = DiscoveryType.All;

/**
 * Changes the discovery type, disconnects the unwanted peers, sets the radio
 * @param newDiscovType The new discovery type to set as
 */
export function setDiscovType(newDiscovType:DiscoveryType):void{
  if(newDiscovType == DiscoveryType.Friends) disconnectNonFriends();
  else if (newDiscovType == DiscoveryType.None) disconnectEveryone();
  discovType = newDiscovType;
  setSelectedRadio(newDiscovType)

}


let canStart = false;
let mainwindow:BrowserWindow;
let broadcastServer:dgram.Socket;

/**
 * Does all the necessary network discovery
 * @param win electron window to send notifications to 
 */
export function netDiscov(win:BrowserWindow):void{
  if(currentPage != Page.AppPage) return; // No discovery unless we are on main page


  if(!canStart){
    mainwindow = win;
    startClientNetDiscovery()
    canStart = true;
  }
  if(broadcastServer != null){
    try{
      broadcastServer.close();      
    }
    catch(e){
      app.relaunch();
      app.quit();
    }
  }

  let message = Buffer.from(`Okuru | Searching for devices | ${getHostName()} | ${getHostID()}`);
  var addr = Object.values(os.networkInterfaces()) // Get all network interfaces
  .flat()
  .filter<os.NetworkInterfaceInfo>(
    (v): v is os.NetworkInterfaceInfo => v !== undefined,
  )
  .filter(({ family, internal }) => family === "IPv4" && !internal)
  .map(({ address }) => address);

var masks = Object.values(os.networkInterfaces()) // Get all network masks
  .flat()
  .filter<os.NetworkInterfaceInfo>(
    (v): v is os.NetworkInterfaceInfo => v !== undefined,
  )
  .filter(({ family, internal }) => family === "IPv4" && !internal)
  .map(({ netmask }) => netmask);

  for (let i = 0; i < addr.length; i++) {
    // Every address <=> mask pair
    try {
      // Broadcast message from IP
      broadcastServer = dgram.createSocket("udp4");
      broadcastServer.on("error", console.error);
      
      broadcastServer.bind(
        {
          address: addr[i],
        },
        () => {
          try {
            broadcastServer.setBroadcast(true); 
            broadcastServer.send(
              message,
              0,
              message.length,
              port,
              getSubnetworkAddr(addr[i], masks[i]),
            );
          } catch (e) {
            if (e.code == "EBADF") {
              addr.filter(val => val !== addr[i]);
            } else {
              throw e;
            }
          }
        },
      );
    } catch (e) { 
      console.log("Error sending discovery packet", e);
      throw new Error("Error while sending discovery packet", { cause: e });
    }
  }
}


/**
 * Uses an address and mask to calculate the subnetwork address (thank you cisco)
 * @param {string} address the address to convert into subnet
 * @param {string} mask the mask to use to convert addr
 * @returns {string}  the subnetwork address 
 */
function getSubnetworkAddr(address:string, mask:string):string {
    let retVal = "";
  
    for (let i = 0; i < address.split(".").length; i++) {
      // Convert mask and address to binary
      let maskBin = dec2bin(address.split(".")[i]);
      let addrBin = dec2bin(mask.split(".")[i]);
      let broadBin = ""; // Broadcast rerturn value
      while (maskBin.length != 8) {
        maskBin = "0" + maskBin;
      }
      while (addrBin.length != 8) {
        addrBin = "0" + addrBin;
      }
  
      // Algorithm to convert mask & address => Broadcast
      for (let j = 0; j < maskBin.length; j++) {
        if (addrBin[j] == "0") broadBin += "1";
        else if (maskBin[j] == "1") broadBin += "1";
        else broadBin += "0";
      }
      retVal += parseInt(broadBin, 2) + "."; // Parse binary to dec
    }
    retVal = retVal.substring(0, retVal.length - 1);
    return retVal;
  }
  
  /**
   * Converts a decimal number to binary representation
   * @param dec {number} Decimal number
   * @returns {String} Binary representation
   */
  function dec2bin(dec) {
    return (dec >>> 0).toString(2);
  }

  
/**
 * Client side search for nearby clients 
 */
function startClientNetDiscovery():void{

  
  let discovClient:dgram.Socket;

  // CLIENT SIDE PEER DISCOVERY
  // PEERS --> SELF

  // creating a client socket
  discovClient = dgram.createSocket('udp4');
  discovClient.on('message', (msg,info) => {
    const addr = Object.values(os.networkInterfaces()) // Get all network interfaces
    .flat()
    .filter<os.NetworkInterfaceInfo>(
      (v): v is os.NetworkInterfaceInfo => v !== undefined,
    )
    .filter(({ family, internal }) => family === "IPv4" && !internal)
    .map(({ address }) => address);

  // Decompose packet
  const hostname = msg.toString().split("|")[2].trim();
  const friendID = msg.toString().split("|")[3].trim();

    if(addr.indexOf(info.address) != -1){
      // TODO : uncomment this for non-testing dist code
      // return; // Received command from self
    }
    for(let i = 0; i < peers.length; i++){
      if(peers[i].friendID == friendID){   
        return; // Received netdisc from already connected device
      }
    } 
    
    
    // Creation of the client
    const client:Socket = io(`http://${info.address}:${port}`, {
      transports: ['websocket'],
      reconnection: false,
      query: `friendID=${getHostID()}&hostName=${getHostName()}}` // HTTP :death:
    });
        
    // Connection error :(
    client.on("connect_error", (err) => {  
      console.log(`connect_error due to ${err.message}`);
      client.disconnect();
      for(let i = 0; i < peers.length; i++){
        if(peers[i].address == info.address){   
          peers.splice(i, 1);
          console.log(`Peer ${hostname} has left the network ! `);
          rpcInvoke('Application:PeersUpdate', peers);
          break;    
        }
      } 

    });
  
    // On Connection, add to peers
    client.on("connect", () => {
      console.log("new connection on client");
      for(let i = 0; i < peers.length; i++){
        if(peers[i].address == info.address){   
          client.disconnect();
          return; // Received netdiscovery from already connected device (wack)
        }
      }   

    });

    client.on("Security:confirm_connection", (publicKey:string) => {
      let connectionObject:Peer = { 
        address:(info.address), 
        ID:(client.id), 
        hostname:(hostname), 
        isFriend: isFriend(friendID, hostname), 
        deviceType: DeviceType.PC, 
        friendID:friendID, 
        publicKey:publicKey
      };
      peers.push(connectionObject)
      rpcInvoke('Application:PeersUpdate', peers)
      console.log(`Peer ${hostname} has joined the network  ! `);
      fileTransfer(client, mainwindow);
    })

    client.on("Security:SignRequest", (data_to_sign:string) => { 
      const sign = createSign('SHA256');
      sign.write(data_to_sign);
      sign.end();

      const signature = sign.sign(
        createPrivateKey({  
          key: Buffer.from(getPrivateKey()),
          format: "pem",
          type: "pkcs8"
      }), 'hex');
      client.emit("Security:ACK:SignRequest", signature);
    })
    

    // On disconnect, remove from peers
    client.on("disconnect", (reason) => {
      for(let i = 0; i < peers.length; i++){
        if(peers[i].address == info.address){   
          peers.splice(i, 1);
          rpcInvoke('Application:PeersUpdate', peers);
          break;    
        }
      } 
    })
  });


  discovClient.bind(port); // Start clcient
}
/**
 * Sends all connected peers to renderer when it is required by renderer
 */
export function SendPeersToRenderer(){
  rpcInvoke('Application:PeersUpdate', peers);
}
