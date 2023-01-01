import { machineIdSync } from "node-machine-id";
import { readFileSync, writeFileSync } from "original-fs";
import { appDataPath, getSockets } from "../server";
import { sep } from "path";
import { DiscoveryType, SavedPeer, Peer, Keys } from "@shared/misc";
import { discovType, peers } from "./netdiscovery";
import { eventHandler } from "./fileReceive";
import { Socket } from "socket.io";

/**
 * Fetches the hostname of the current machine, easier than reading file every time
 * @returns the hostname of the current machine
 */
export function getHostName():string{ 
    const hostname:string = readFileSync(`${ appDataPath }user/hostname.txt`).toString(); 
    return hostname;
}


/**
 * Fetches and returns the device's public key
 * @returns the device's public key
 */
export function getPublicKey():string{
    const keys:Keys = JSON.parse(readFileSync(`${appDataPath}User${ sep }keys.txt`).toString());
    return keys.publicKey;
}

/**
 * Fetches and returns the device's private key
 * @returns the device's public key
 */
export function getPrivateKey():string{
    const keys:Keys = JSON.parse(readFileSync(`${appDataPath}User${ sep }keys.txt`).toString());
    return keys.privateKey;
}


/**
 * Fetches the hostname ID of the current machine, simple helper macro instead of typing machineIdSync();
 * @returns the hostname ID of the current machine
 */
export function getHostID():string{
    return machineIdSync();
}

/**
 * Checks if a person is a friend in the local database, and updates name in local json database if they changed their name
 * @param friendID friendID of the peer
 * @param hostname current hostname of the peer
 * @returns true if user is a friend, false if not
 */
export function isFriend(friendID:string, hostname?:string):boolean{ 
    let friends:SavedPeer[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read file
    for(let i = 0; i < friends.length; i++){ // Go through the array
        if(friends[i].friendID == friendID){ // We are friends with hem!
            if(hostname == null) return true;
            if(friends[i].lastHostname != hostname){ // name has changed since! 
                friends[i].lastHostname = hostname;
                writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify(friends));
            }
            return true; 
        }
    }
    return false;
}


export function getFriends():SavedPeer[]{
    return JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read file
}

export function getBlocked():SavedPeer[]{
    return JSON.parse(readFileSync(`${appDataPath}User${ sep }blocked.txt`).toString())
}


/**
 * Check if a certain user is blocked, we terminate the connection if they are
 * @param friendID the friendID of the person to check if they're a friend or not
 * @returns true if the user is a friend, false if not
 */
export function isBlocked(friendID:string):boolean{
    let blocked:SavedPeer[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }blocked.txt`).toString()); // Read file
    for(let i = 0; i < blocked.length; i++){ // Go through the array
        if(blocked[i].friendID == friendID){ // We have them blocked!
            return true;
        }
    }
    return false;
}

export function blockPeer(peer:Peer){
    let blocked:SavedPeer[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }blocked.txt`).toString()); // Read file
    blocked.push({friendID:peer.friendID, lastHostname:peer.hostname, deviceType:peer.deviceType, publicKey:peer.publicKey});
    writeFileSync(`${appDataPath}User${ sep }blocked.txt`, JSON.stringify(blocked));
    if(isFriend(peer.friendID, peer.hostname)){
        removeFriend(peer.friendID)
    }
    disconnectBlocked();
}


/**
 * Adds a peer as a friend to the local database
 * @param friendID FriendID of the peer to add to the local database
 * @param hostname Name of the peer to add to the local database
 */
export function addFriend(peer:Peer):void{
    console.log("Added as friend!");

    let friends:SavedPeer[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read
    const newFriend:SavedPeer = {friendID:peer.friendID, lastHostname:peer.hostname, deviceType:peer.deviceType, publicKey:peer.publicKey}; // Create friend object
    friends.push(newFriend); // Add
    writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify(friends)); // Write
    for(let i = 0; i < peers.length; i++){
        if(peers[i].friendID == peer.friendID){
            peers[i].isFriend = true;
            break;
        }
    }
        
}
/**
 * Removes a peer as a friend from the local database
 * @param friendID FriendID of the peer to remove from the local database
 */
export function removeFriend(friendID:string):void{
    let friends:SavedPeer[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read
    
    friends = friends.filter(x => x.friendID != friendID); // Remove
    writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify(friends)); // Write
    for(let i = 0; i < peers.length; i++){ // Filter
        if(peers[i].friendID == friendID){

            if(discovType == DiscoveryType.Friends) disconnectNonFriends();

            peers[i].isFriend = false;
            break;
        }
    }
}

export function disconnectNonFriends(){
    const currentSockets:{Socket:Socket, friendID:string}[] = getSockets();
    let friends:SavedPeer[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read
    let friendsIDs:string[] = [];
    for(let i = 0; i < friends.length; i++){
        friendsIDs.push(friends[i].friendID);
    }
    for(let i = 0; i < currentSockets.length; i++){ // Filter
        if(!friendsIDs.includes(currentSockets[i].friendID)){
            eventHandler.emit(`Application:DisconnectSocket:${currentSockets[i].Socket.id}`)
        }
    }
}


export function disconnectEveryone(){
    const currentSockets:{Socket:Socket, friendID:string}[] = getSockets();

    for(let i = 0; i < currentSockets.length; i++){ // Filter
        eventHandler.emit(`Application:DisconnectSocket:${currentSockets[i].Socket.id}`)
    }
}

export function disconnectBlocked(){
    const currentSockets:{Socket:Socket, friendID:string}[] = getSockets();

    for(let i = 0; i < currentSockets.length; i++){ // Iterative algo
        if(isBlocked(currentSockets[i].friendID)){
            eventHandler.emit(`Application:DisconnectSocket:${peers[i].ID}`)
        }
    }
}

export function getFriendPK(friendID:string){
    return getFriends().filter(x => x.friendID == friendID)[0].publicKey;
}

export function canBeDiscoveredBy(friendID:string):boolean{
    if(discovType == DiscoveryType.None) return false;
    if(isBlocked(friendID)) return false;
    if(discovType == DiscoveryType.Friends){
        if(!isFriend(friendID)) return false;
    }    
    return true;
}