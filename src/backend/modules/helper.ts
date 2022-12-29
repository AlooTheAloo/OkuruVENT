import { machineIdSync } from "node-machine-id";
import { readFileSync, writeFileSync } from "original-fs";
import { appDataPath } from "../server";
import { sep } from "path";
import { DiscoveryType, Friend } from "@shared/misc";
import { discovType, peers } from "./netdiscovery";
import { eventHandler } from "./fileReceive";

/**
 * Fetches the hostname of the current machine, easier than reading file every time
 * @returns the hostname of the current machine
 */
export function getHostName():string{ 
    const hostname:string = readFileSync(`${ appDataPath }user/hostname.txt`).toString(); 
    return hostname;
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
export function isFriend(friendID:string, hostname:string):boolean{ 
    let friends:Friend[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read file
    for(let i = 0; i < friends.length; i++){ // Go through the array
        if(friends[i].friendID == friendID){ // We are friends with hem!
            if(friends[i].lastHostname != hostname){ // name has changed since! 
                friends[i].lastHostname = hostname;
                writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify(friends));
            }
            return true; 
        }
    }
    return false;
}


export function getFriends():Friend[]{
    return JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read file
}

/**
 * Check if a certain user is blocked, we terminate the connection if they are
 * @param friendID the friendID of the person to check if they're a friend or not
 * @returns true if the user is a friend, false if not
 */
export function isBlocked(friendID:string):boolean{
    let blocked:Friend[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }blocked.txt`).toString()); // Read file
    for(let i = 0; i < blocked.length; i++){ // Go through the array
        if(blocked[i].friendID == friendID){ // We have them blocked!
            return true;
        }
    }
    return false;
}

export function blockPeer(friendID:string, hostname:string){
    let blocked:Friend[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }blocked.txt`).toString()); // Read file
    blocked.push({friendID:friendID, lastHostname:hostname});
    writeFileSync(`${appDataPath}User${ sep }blocked.txt`, JSON.stringify(blocked));
    if(isFriend(friendID, hostname)){
        removeFriend(friendID)
    }
    disconnectBlocked();
}


/**
 * Adds a peer as a friend to the local database
 * @param friendID FriendID of the peer to add to the local database
 * @param hostname Name of the peer to add to the local database
 */
export function addFriend(friendID:string, hostname:string):void{
    let friends:Friend[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read
    const newFriend:Friend = {friendID:friendID, lastHostname:hostname}; // Create friend object
    friends.push(newFriend); // Add
    writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify(friends)); // Write
    for(let i = 0; i < peers.length; i++){
        if(peers[i].friendID == friendID){
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
    let friends:Friend[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read
    
    friends = friends.filter(x => x.friendID != friendID); // Remove
    writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify(friends)); // Write
    for(let i = 0; i < peers.length; i++){ // Filter
        if(peers[i].friendID == friendID){

            if(discovType == DiscoveryType.Friends){
                eventHandler.emit(`Application:DisconnectSocket:${peers[i].ID}`)
            }

            peers[i].isFriend = false;
            break;
        }
    }
}

export function disconnectNonFriends(){
    let friends:Friend[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read
    let friendsIDs:string[] = [];
    for(let i = 0; i < friends.length; i++){
        friendsIDs.push(friends[i].friendID);
    }
    for(let i = 0; i < peers.length; i++){ // Filter
        if(!friendsIDs.includes(peers[i].friendID)){
            eventHandler.emit(`Application:DisconnectSocket:${peers[i].ID}`)
        }
    }
}


export function disconnectEveryone(){
    for(let i = 0; i < peers.length; i++){ // Filter
            eventHandler.emit(`Application:DisconnectSocket:${peers[i].ID}`)
    }
}

export function disconnectBlocked(){
    for(let i = 0; i < peers.length; i++){ // Iterative algo
        if(isBlocked(peers[i].friendID)){
            eventHandler.emit(`Application:DisconnectSocket:${peers[i].ID}`)
        }
    }
}



export function canBeDiscoveredBy(friendID:string, hostname:string):boolean{
    if(discovType == DiscoveryType.None) return false;
    if(isBlocked(friendID)) return false;
    if(discovType == DiscoveryType.Friends){
        if(!isFriend(friendID, hostname)) return false;
    }    
    return true;
}