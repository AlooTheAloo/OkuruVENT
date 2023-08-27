import { Delivery } from "@shared/misc";
import { readFileSync, writeFileSync } from "original-fs";
import { appDataPath } from "../server";
import { sep } from "path";
export function addToHistoryFile(newTransfer: Delivery) {
  const fileContents: Delivery[] = JSON.parse(
    readFileSync(`${appDataPath}User${sep}history.txt`).toString(),
  );
  fileContents.push(newTransfer);
  writeFileSync(
    `${appDataPath}User${sep}history.txt`,
    JSON.stringify(fileContents),
  );
}

export function clearHistory() {
  writeFileSync(`${appDataPath}User${sep}history.txt`, JSON.stringify([]));
}

export function fetchHistory(): Delivery[] {
  console.log(`${appDataPath}User${sep}history.txt`);
  return JSON.parse(
    readFileSync(`${appDataPath}User${sep}history.txt`).toString(),
  ).map(x => ({
    ...x,
    date: new Date(x.date),
  }));
}
