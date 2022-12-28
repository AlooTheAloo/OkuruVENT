import { mkdirSync, writeFileSync } from "original-fs";
import { sep } from 'path';

export function createApp(appDataPath:string, chosenHostname:string):void{
    mkdirSync(`${appDataPath}User${ sep }`);
    writeFileSync(`${appDataPath}User${ sep }hostname.txt`, chosenHostname);
    writeFileSync(`${appDataPath}User${ sep }friends.txt`, JSON.stringify([{}]));
}

