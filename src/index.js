const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const { Authenticator, Client: MCLCClient } = require('minecraft-launcher-core');
const { lookupUUID } = require('namemc');
const fetch = require('node-fetch');
const { Client: RPCClient } = require('discord-rpc');
const ImgurAnonymousUploader = require('imgur-anonymous-uploader');
const launcher = new MCLCClient();
const RPC = new RPCClient({ transport: 'ipc' });
RPC.login({ clientId: '819991168263258145' }).catch(() => {});
const pkg = require('./../package.json');
launcher.on('data', (i) => {
  if (i.includes('Setting user: ')) {
    mainWindow.webContents.send('info', `Game started as ${i.split('Setting user: ')[1]}`);
    RPC.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {
        details: 'Idling',
        state: 'Minecraft',
        assets: {
          large_image: 'default',
          large_text: `SkyLauncher v${pkg.version}`,
          small_image: 'steve',
          small_text: username || 'Unknow Player'
        },
        timestamps: {
          start: new Date().getTime()
        },
        instance: true
      }
    });
    // mainWindow.webContents.send('download-status', { type: 'null', current: 0, total: 0, name: 'null' });
    // mainWindow.webContents.send('progress', { type: 'null', task: 0, total: 0 });
  }
  if (i.includes('Stopping!')) {
    mainWindow.webContents.send('info', 'Game stopped');
    RPC.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {
        details: 'Idling',
        state: `SkyLauncher v${pkg.version}`,
        assets: {
          large_image: 'default',
          large_text: `SkyLauncher v${pkg.version}`,
          small_image: 'steve',
          small_text: username || 'Unknow Player'
        },
        timestamps: {
          start: new Date().getTime()
        },
        instance: true
      }
    });
  }
  if (i.includes('Starting integrated minecraft server version')) {
    const version = i.split('Starting integrated minecraft server version ')[1];
    RPC.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {
        details: 'Playing Singleplayer',
        state: `Minecraft ${version}`,
        assets: {
          large_image: 'default',
          large_text: `SkyLauncher v${pkg.version}`,
          small_image: 'steve',
          small_text: username || 'Unknow Player'
        },
        timestamps: {
          start: new Date().getTime()
        },
        instance: true
      }
    });
  }
  if (i.includes('Connecting to')) {
    const ip = i.split('Connecting to ')[1].split(',')[0];
    RPC.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {
        details: `Playing on ${ip}`,
        state: 'Minecraft',
        assets: {
          large_image: 'default',
          large_text: `SkyLauncher v${pkg.version}`,
          small_image: 'steve',
          small_text: username || 'Unknow Player'
        },
        timestamps: {
          start: new Date().getTime()
        },
        instance: true
      }
    });
  }

  if (i.includes('Stopping singleplayer server as player logged out')) {
    RPC.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {
        details: 'Idling',
        state: 'Minecraft',
        assets: {
          large_image: 'default',
          large_text: `SkyLauncher v${pkg.version}`,
          small_image: 'steve',
          small_text: username || 'Unknow Player'
        },
        timestamps: {
          start: new Date().getTime()
        },
        instance: true
      }
    });
  }

  // console.log('data', i);
});
launcher.on('download-status', (i) => {
  mainWindow.webContents.send('download-status', i);
});
// launcher.on('progress', (i) => {
//   mainWindow.webContents.send('progress', i);
// });

let mainWindow;
let accessToken;
let auth;
let username;
const uploader = new ImgurAnonymousUploader('e2ff096ad516289');

function createWindow () {
  mainWindow = new BrowserWindow({
    title: `SkyLauncher v${pkg.version}`,
    icon: path.join(__dirname, 'views', 'assets', 'logo.png'),
    width: 550,
    height: 700,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(path.join(__dirname, 'views', 'login.html'));

  RPC.request('SET_ACTIVITY', {
    pid: process.pid,
    activity: {
      details: 'Idling',
      state: `SkyLauncher v${pkg.version}`,
      assets: {
        large_image: 'default',
        large_text: `SkyLauncher v${pkg.version}`,
        small_image: 'steve',
        small_text: username || 'Unknow Player'
      },
      timestamps: {
        start: new Date().getTime()
      },
      instance: true
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('login', (_, data) => {
  Authenticator.getAuth(data.username, data.password)
    .then((data) => {
      auth = data;
      username = data.name;
      mainWindow.loadURL(path.join(__dirname, 'views', 'home.html'));
      RPC.request('SET_ACTIVITY', {
        pid: process.pid,
        activity: {
          details: 'Idling',
          state: `SkyLauncher v${pkg.version}`,
          assets: {
            large_image: 'default',
            large_text: `SkyLauncher v${pkg.version}`,
            small_image: 'steve',
            small_text: data.name || 'Unknow Player'
          },
          timestamps: {
            start: new Date().getTime()
          },
          instance: true
        }
      });
      lookupUUID(data.uuid).then(user => {
        accessToken = data.access_token;
        mainWindow.webContents.send('userData', user);
        fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json')
          .then(res => res.json())
          .then(data => {
            mainWindow.webContents.send('versionsData', data);
          });
      });
    })
    .catch((err) => {
      mainWindow.webContents.send('error', err.message);
    });
});

ipcMain.on('news', async () => {
  mainWindow.loadURL('https://www.minecraft.net/en-us/community');
});

ipcMain.on('launch', async (_, { version, ram, username }) => {
  try {
    const opts = {
      clientPackage: null,
      root: `${app.getPath('appData')}${path.sep}.skylauncher`,
      version,
      memory: {
        min: ram === 1 ? `${ram}G` : `${ram - 1}G`,
        max: `${ram}G`
      },
      authorization: auth
    };
    launcher.launch(opts);
  } catch (err) {
    console.error(err);
    mainWindow.webContents.send('error', err.message);
  }
});

ipcMain.on('logout', () => {
  mainWindow.loadURL(path.join(__dirname, 'views', 'login.html'));
});

ipcMain.on('changeUsername', async (_, data) => {
  try {
    const userAccessToken = accessToken;
    const res = await fetch(`https://api.minecraftservices.com/minecraft/profile/name/${data.newName}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.status === 200) {
      username = data.newName;
      mainWindow.webContents.send('success', 'Name changed successfully!', data.newName);
    } else if (res.status === 400) {
      mainWindow.webContents.send('error', 'Name is invalid (longer than 16 characters or contains invalid characters)');
    } else if (res.status === 403) {
      mainWindow.webContents.send('error', 'Name is unavailable (Either taken or has not become available)');
    } else if (res.status === 401) {
      mainWindow.webContents.send('error', 'Unauthorized (Try closing this window and reopening it)');
    } else if (res.status === 404) {
      mainWindow.webContents.send('error', 'Name is invalid (longer than 16 characters or contains invalid characters)');
    } else {
      mainWindow.webContents.send('error', `${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error(err);
    mainWindow.webContents.send('error', err.message);
  }
});

ipcMain.on('changeSkin', async (_, data) => {
  try {
    if (!data.filePath) return mainWindow.webContents.send('error', 'No file provided');
    const skinRes = await uploader.upload(data.filePath);
    const userAccessToken = accessToken;
    const res = await fetch('https://api.minecraftservices.com/minecraft/profile/skins', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        variant: data.variant,
        url: skinRes.url
      })
    });
    if (res.status === 200) {
      mainWindow.webContents.send('success', 'Skin changed successfully!');
    } else {
      mainWindow.webContents.send('error', `${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error(err);
    mainWindow.webContents.send('error', err.message);
  }
});
