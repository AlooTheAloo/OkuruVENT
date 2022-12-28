import { mkdirSync, writeFileSync } from "original-fs";
import { sep } from 'path';

/**
 * Creates the folder for the app to live in (~/okuru/user/)
 * @param appDataPath path of appdata (OS dependent) thanks electron! 
 * @param chosenHostname hostname that was selected in the start page
 */
export function createApp(appDataPath:string, chosenHostname:string):void{
    mkdirSync(`${appDataPath}User${ sep }`);
    writeFileSync(`${appDataPath}User${ sep }hostname.txt`, chosenHostname);
    writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify([]));
}

