import "source-map-support/register";

import appicon from "./public/images/unWYSItp.png"; // TODO: change this out for official logo
import { app, BrowserWindow, Menu, MenuItem, Tray } from "electron";
import install, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
import path from "path";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if ((await import("electron-squirrel-startup")).default) {
  app.quit();
}

import { startNetDiscovery } from "./backend/server";
import { discovType, setDiscovType } from "./backend/modules/netdiscovery";
import { DiscoveryType } from "@shared/misc";
import { rpcInvoke } from "./rpc";
import isDev from "electron-is-dev";

const createWindow = () => {
  // Create the browser window.

  const mainWindow: BrowserWindow = new BrowserWindow({
    resizable: false,
    frame: true,
    width: 1293,
    height: 727,
    fullscreenable: false,
    webPreferences: {
      sandbox: false,
      preload: MAIN_PAGE_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Okuru",
  });

  // mainWindow.setIcon(fetchPath(appicon));
  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  process.on("SIGTERM", () => {
    app.exit(0);
  });
  //mainWindow.webContents.openDevTools();
  // @ts-ignore
  global.mainWindow = mainWindow;

  // and load the current page
  mainWindow.loadURL(MAIN_PAGE_WEBPACK_ENTRY);
  //mainWindow.loadURL(PAIR_PAGE_WEBPACK_ENTRY);

  startNetDiscovery(mainWindow);
  mainWindow.on("close", event => {
    event.preventDefault(); //this prevents it from closing. The `closed` event will not fire now
    mainWindow.hide();
  });
};

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

export let contextMenu: Menu;

process.on("SIGTERM", () => {
  app.exit(0);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
app.whenReady().then(async () => {
  await install(VUEJS3_DEVTOOLS);
  createWindow();
  console.log("DIRNAME " + __dirname);
  const tray = new Tray(fetchPath(appicon));
  contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      type: "normal",

      click: () => {
        mainWindow.show();
      },
    },

    { type: "separator" },

    {
      label: "Everyone",
      type: "radio",
      id: "Everyone",
      checked: discovType == DiscoveryType.All,
      click: m => {
        rpcInvoke("Application:DiscoveryType", DiscoveryType.All);
        setDiscovType(DiscoveryType.All);
        mainWindow.show();
      },
    },
    {
      label: "Friends",
      type: "radio",
      checked: discovType == DiscoveryType.Friends,
      id: "Friends",
      click: m => {
        setDiscovType(DiscoveryType.Friends);
        rpcInvoke("Application:DiscoveryType", DiscoveryType.Friends);
        mainWindow.show();
      },
    },
    {
      label: "No one",
      type: "radio",
      id: "Noone",
      checked: discovType == DiscoveryType.None,
      click: m => {
        setDiscovType(DiscoveryType.None);
        rpcInvoke("Application:DiscoveryType", DiscoveryType.None);
        mainWindow.show();
      },
    },
    { type: "separator" },

    {
      label: "Exit",
      type: "normal",
      click: () => {
        app.exit(0);
      },
    },
  ]);

  tray.setToolTip("Okuru - Running in the background");
  tray.setContextMenu(contextMenu);
  tray.addListener("click", () => {
    mainWindow.show();
  });
});

/**
 * Selects one of the radio in the context menu of the tray icon
 * @param discovType The target radio to select
 */
export function setSelectedRadio(discovType: DiscoveryType): void {
  let targetEl: MenuItem | null;
  switch (discovType) {
    case DiscoveryType.All:
      targetEl = contextMenu.getMenuItemById("Everyone");
      break;
    case DiscoveryType.Friends:
      targetEl = contextMenu.getMenuItemById("Friends");
      break;
    case DiscoveryType.None:
      targetEl = contextMenu.getMenuItemById("Noone");
      break;
  }
  if (targetEl != null) {
    targetEl.checked = true;
  }
}

/**
 * Converts a Dev path to a distribution path if necessary
 * @param inputPath the Dev path
 * @returns the dev/distribution path depending on context
 */
function fetchPath(inputPath: string): string {
  return isDev ? inputPath : path.join("../../", inputPath);
}
