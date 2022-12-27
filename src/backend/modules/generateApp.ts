import { mkdirSync, writeFileSync } from "original-fs";

export function createHash():string{
    const stringLength:number = 56;
    let alphabet:string = "abcdefghijklmnopqrstuvwxyz";
    alphabet += alphabet.toUpperCase();
    alphabet += "01234566672789";
    let retval:string = "";
    for(let i:number = 0; i < stringLength; i++){
        const index:number = Math.floor(Math.random()*(alphabet.length + 1));
        retval += alphabet.charAt(index);
    }
    return retval;
}

export function createApp(appDataPath:string, chosenHostname:string):void{
    const hash:string = createHash();
    mkdirSync(`${appDataPath}User/`);
    writeFileSync(`${appDataPath}User/permanentToken.txt`, hash);
    writeFileSync(`${appDataPath}User/hostname.txt`, chosenHostname);
}

