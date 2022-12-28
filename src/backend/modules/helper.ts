import { machineIdSync } from "node-machine-id";
import { readFileSync, writeFileSync } from "original-fs";
import { appDataPath } from "../server";
import { sep } from "path";
import { Friend } from "@shared/misc";
export function getHostName():string{ 
    const hostname:string = readFileSync(`${ appDataPath }user/hostname.txt`).toString(); 
    return hostname;
}

export function getHostID():string{
    return machineIdSync();
}
export function isFriend(friendID:string, hostname:string):boolean{ 
    let friends:Friend[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString());
    for(let i = 0; i < friends.length; i++){
        if(friends[i].friendID == friendID){
            if(friends[i].lastHostname = hostname){
                friends[i].lastHostname = hostname;
            }
            writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify(friends));
            return true;
        }
    }
    
    return false;
}

export function addFriend(friendID:string, hostname:string):void{
    let friends:Friend[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString());
    const newFriend:Friend = {friendID:friendID, lastHostname:hostname};
    friends.push(newFriend);
    writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify(friends));
}