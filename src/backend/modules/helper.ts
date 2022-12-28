import { machineIdSync } from "node-machine-id";
import { readFileSync, writeFileSync } from "original-fs";
import { appDataPath } from "../server";
import { sep } from "path";
import { Friend } from "@shared/misc";
import { peers } from "./netdiscovery";

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

export function removeFriend(friendID:string):void{
    let friends:Friend[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString()); // Read
    
    friends.filter(x => x.friendID != friendID); // Remove
    writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify(friends)); // Write
    for(let i = 0; i < peers.length; i++){ // Filter
        if(peers[i].friendID == friendID){
            peers[i].isFriend = false;
            break;
        }
    }
}