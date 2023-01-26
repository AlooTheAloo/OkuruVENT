import { mkdirSync, writeFileSync } from "original-fs";
import { generateKeyPairSync } from "crypto";
import { sep } from "path";
import { Keys } from "@shared/misc";

/**
 * Creates the folder for the app to live in (~/okuru/user/)
 * @param appDataPath path of appdata (OS dependent) thanks electron!
 * @param chosenHostname hostname that was selected in the start page
 */
export function createApp(appDataPath: string, chosenHostname: string): void {
  mkdirSync(`${appDataPath}User${sep}`);
  writeFileSync(`${appDataPath}User${sep}hostname.txt`, chosenHostname);
  writeFileSync(`${appDataPath}User${sep}friends.txt`, JSON.stringify([]));
  writeFileSync(`${appDataPath}User${sep}blocked.txt`, JSON.stringify([]));
  writeFileSync(
    `${appDataPath}User${sep}keys.txt`,
    JSON.stringify(generateKeys()),
  );
  writeFileSync(`${appDataPath}User${sep}history.txt`, JSON.stringify([]));
}

/**
 * Generates key pair to use to store in file
 * @returns Keys object
 */
function generateKeys(): Keys {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
  });
  return {
    publicKey: publicKey.export({ type: "spki", format: "pem" }).toString(),
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}
