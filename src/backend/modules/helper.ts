import { Peer } from "@shared/misc";
import { machineIdSync } from "node-machine-id";
import { readFileSync } from "original-fs";
import { appDataPath } from "../server";
import { sep } from "path";
export function getHostName():string{ 
    const hostname:string = readFileSync(`${ appDataPath }user/hostname.txt`).toString(); 
    return hostname;
}

export function getHostID():string{
    return machineIdSync();
}
export function isFriend(friendID:string):boolean{ 
    
    let friends:Peer[] = JSON.parse(readFileSync(`${appDataPath}User${ sep }friends.txt`).toString());
    return false;
}