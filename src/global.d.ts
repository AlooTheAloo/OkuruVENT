import type { BrowserWindow } from "electron";

export interface LolLmao {
  mainWindow: BrowserWindow;
}

declare global {
  interface Window extends LolLmao {}
}
