import "source-map-support/register";

import appicon from "./public/images/unWYSItp.png" // TODO: change this out for official logo
import { app, BrowserWindow, Menu, Tray } from "electron";
import install, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if ((await import("electron-squirrel-startup")).default) {
  app.quit();
}


import { startNetDiscovery } from "./backend/server";

const createWindow = () => {
  // Create the browser window.

  const mainWindow:BrowserWindow = new BrowserWindow({
    resizable:false,
    frame: true,
    width: 1293,
    height: 727,
    webPreferences: {
      preload: MAIN_PAGE_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Okuru",
  });

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
  
 

  // @ts-ignore
  global.mainWindow = mainWindow;

  // and load the current page
  mainWindow.loadURL(MAIN_PAGE_WEBPACK_ENTRY);
  //mainWindow.loadURL(PAIR_PAGE_WEBPACK_ENTRY);

  // Open the DevTools
  startNetDiscovery(mainWindow);
  mainWindow.on('close', event=>{
    event.preventDefault(); //this prevents it from closing. The `closed` event will not fire now
    mainWindow.hide();
  })
  
};



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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
app.whenReady().then(async () => {
  await install(VUEJS3_DEVTOOLS);
  createWindow();

  const tray = new Tray(appicon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Window",
      type: "normal",

      click: () => {
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
  // Nouvel appel pour Linux
  tray.setContextMenu(contextMenu);
  tray.addListener("click", function () {
    mainWindow.show();
  });

});