import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { startServer } from "./server";
import { getSettings, updateSettings } from "./db";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isPaused = false;

const TRAY_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAwklEQVQ4T2NkoBAwUqifgWoGJBf8Z2BgYGAEijMyMDAwMKAz" +
  "gIGBgYGBgYGBgfH/f4b/DAwMDIyMjAwMDAwMjIyMDIyMjI8ZGBgYGP9jsAwMDAz/GRgYGBiAapCBEUCdIYGB" +
  "gYGBhZGRkYGBgYGBkZGRgYGBgZGRkYGBgYGRkZGBgYGBkZGBgYGBkZGBgYGBkZGBgYGBkZGBgYGBkZGBgYGBkZGBgYGBkZGBgYGBkZGBgYGBkZ" +
  "GB//8ZGBgYGBgYGCkLCgBRHBshKLu5XAAAAABJRU5ErkJggg==";

function send(channel: string, data?: unknown) {
  mainWindow?.webContents.send(channel, data);
}

function buildTrayMenu(): Menu {
  const settings = getSettings();
  const chaosLevels = ["low", "normal", "high", "insane"] as const;

  return Menu.buildFromTemplate([
    { label: "Spidey — Virtual Tarantula", enabled: false },
    { type: "separator" },

    // Feeding
    { label: "Feed (Kibble)", click: () => send("tray:cmd", { type: "feed", food: "kibble_basic" }) },
    { label: "Drop Cricket", click: () => send("tray:cmd", { type: "dropFood", food: "cricket" }) },
    { label: "Drop Moth", click: () => send("tray:cmd", { type: "dropFood", food: "moth" }) },
    { label: "Drop Roach", click: () => send("tray:cmd", { type: "dropFood", food: "roach" }) },
    { type: "separator" },

    // Toys
    { label: "Drop Ball Toy", click: () => send("tray:cmd", { type: "dropToy", toy: "ball" }) },
    { label: "Drop Stick Toy", click: () => send("tray:cmd", { type: "dropToy", toy: "stick" }) },
    { label: "Drop Rock (hide spot)", click: () => send("tray:cmd", { type: "dropToy", toy: "rock" }) },
    { label: "Drop Water Bowl", click: () => send("tray:cmd", { type: "dropToy", toy: "water" }) },
    { type: "separator" },

    // Actions
    { label: "Pet Spidey", click: () => send("tray:cmd", { type: "pet" }) },
    { label: "Play With Her", click: () => send("tray:cmd", { type: "play" }) },
    { label: "Put to Sleep", click: () => send("tray:cmd", { type: "sleep" }) },
    { label: "Wake Up", click: () => send("tray:cmd", { type: "wakeup" }) },
    { type: "separator" },

    // Screen damage
    {
      label: "Reset Screen Damage",
      click: () => send("tray:cmd", { type: "resetDamage" }),
    },
    { type: "separator" },

    // Pause
    {
      label: isPaused ? "▶ Resume Spidey" : "⏸ Pause Spidey",
      click: () => {
        isPaused = !isPaused;
        send("tray:cmd", { type: "pause", paused: isPaused });
        tray?.setContextMenu(buildTrayMenu());
      },
    },

    // Settings submenu
    {
      label: "Settings",
      submenu: [
        {
          label: "Screen Damage",
          submenu: [
            { label: "Enable", type: "radio", checked: settings.screenDamageEnabled, click: () => { updateSettings({ screenDamageEnabled: true }); send("tray:cmd", { type: "settings", key: "screenDamageEnabled", value: true }); } },
            { label: "Disable", type: "radio", checked: !settings.screenDamageEnabled, click: () => { updateSettings({ screenDamageEnabled: false }); send("tray:cmd", { type: "settings", key: "screenDamageEnabled", value: false }); } },
          ],
        },
        {
          label: "Chaos Level",
          submenu: chaosLevels.map(level => ({
            label: level.charAt(0).toUpperCase() + level.slice(1),
            type: "radio" as const,
            checked: settings.chaosLevel === level,
            click: () => {
              updateSettings({ chaosLevel: level });
              send("tray:cmd", { type: "settings", key: "chaosLevel", value: level });
              tray?.setContextMenu(buildTrayMenu());
            },
          })),
        },
        {
          label: "Pet Size",
          submenu: [
            { label: "Small (Baby)", type: "radio", checked: settings.petSize < 0.7, click: () => { updateSettings({ petSize: 0.55 }); send("tray:cmd", { type: "settings", key: "petSize", value: 0.55 }); } },
            { label: "Normal", type: "radio", checked: settings.petSize >= 0.7 && settings.petSize <= 1.1, click: () => { updateSettings({ petSize: 1.0 }); send("tray:cmd", { type: "settings", key: "petSize", value: 1.0 }); } },
            { label: "Large", type: "radio", checked: settings.petSize > 1.1, click: () => { updateSettings({ petSize: 1.45 }); send("tray:cmd", { type: "settings", key: "petSize", value: 1.45 }); } },
          ],
        },
        { type: "separator" },
        { label: "Reset Pet", click: () => send("tray:cmd", { type: "revive" }) },
        { label: "Reset Everything", click: () => send("tray:cmd", { type: "resetAll" }) },
      ],
    },
    { type: "separator" },
    { label: "Quit Spidey", click: () => app.quit() },
  ]);
}

async function createWindow(): Promise<void> {
  await startServer();
  const primary = screen.getPrimaryDisplay();
  const { x, y, width, height } = primary.bounds;

  mainWindow = new BrowserWindow({
    x, y, width, height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  ipcMain.handle("overlay:setClickThrough", (_e, enabled: boolean) => {
    if (enabled) mainWindow?.setIgnoreMouseEvents(true, { forward: true });
    else mainWindow?.setIgnoreMouseEvents(false);
  });

  ipcMain.handle("overlay:getScreenSize", () => {
    const b = screen.getPrimaryDisplay().workAreaSize;
    return { width: b.width, height: b.height };
  });

  ipcMain.handle("overlay:getSettings", () => getSettings());

  const icon = nativeImage.createFromDataURL(TRAY_ICON);
  tray = new Tray(icon);
  tray.setToolTip("Spidey — Right-click to interact");
  tray.setContextMenu(buildTrayMenu());
  tray.on("double-click", () => {
    send("tray:cmd", { type: "feed", food: "kibble_basic" });
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.spidey.pet");
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
