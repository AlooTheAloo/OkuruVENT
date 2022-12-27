import { readFileSync } from "original-fs";
import { appDataPath } from "../server";

export function getHostName():string{ 
    const hostname:string = readFileSync(`${ appDataPath }user/hostname.txt`).toString(); 
    return hostname;
}