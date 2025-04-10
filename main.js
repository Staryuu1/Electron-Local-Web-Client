// === main.js ===
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const os = require('os');
const net = require('net');
const path = require('path');
const http = require('http');
const fs = require('fs');

const {loadLanguage, t, setLanguage }= require('./language');

const unsafePorts = [
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53,
  77, 79, 87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115, 117,
  119, 123, 135, 139, 143, 179, 389, 427, 465, 512, 513, 514, 515,
  526, 530, 531, 532, 540, 548, 556, 563, 587, 601, 636, 993, 995,
  2049, 3659, 4045, 6000, 6665, 6666, 6667, 6668, 6669, 6697
];

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

let settings = {
  scanTimeout: 500,
  ipScanRange: 254,
  defaultPorts: [8000, 8080, 3000, 5000],
  blockUnsafePorts: true,
  autoOpenIfSingleResult: false,
  showServerTitles: true,
  language: 'Indonesia', 
  theme: 'Dark'
};
loadLanguage(settings.language);

try {
  if (fs.existsSync(SETTINGS_PATH)) {
    settings = JSON.parse(fs.readFileSync(SETTINGS_PATH));
  }
} catch (e) {
  console.error('Gagal membaca settings:', e);
}
function getLocalizedPath(fileName) {
  const theme = settings.theme || 'Dark';
  return path.join(__dirname, 'views', theme, fileName);
}

ipcMain.handle('load-settings', () => settings);
ipcMain.on('save-settings', (_e, newSettings) => {
  settings = newSettings;
  setLanguage(settings.language);
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings));
});

ipcMain.on('open-settings', () => {
  const settingsWin = new BrowserWindow({
    width: 500,
    height: 650,
    resizable: false,
    autoHideMenuBar: true,
    modal: true,
    parent: BrowserWindow.getFocusedWindow(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWin.loadFile(getLocalizedPath('settings.html'));
});

ipcMain.handle('translate', (_event, key) => {
  return t(key);
});


function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        const subnet = net.address.split('.').slice(0, 3).join('.');
        for (let i = 1; i <= settings.ipScanRange; i++) {
          ips.push(`${subnet}.${i}`);
        }
      }
    }
  }
  return ips;
}

function checkPortOpen(ip, port, timeout = settings.scanTimeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve({ ip, port });
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(null);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(null);
    });
    socket.connect(port, ip);
  });
}

function fetchTitle(ip, port) {
  return new Promise((resolve) => {
    http.get(`http://${ip}:${port}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/<title>(.*?)<\/title>/i);
        const title = match ? match[1] : 'Tanpa Judul';
        resolve({ ip, port, title });
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

async function scanForServers(ports) {
  const ips = getLocalIPs();
  const checks = [];
  for (const ip of ips) {
    for (const port of ports) {
      if (settings.blockUnsafePorts && unsafePorts.includes(port)) continue;
      checks.push(checkPortOpen(ip, port));
    }
  }
  const openPorts = (await Promise.all(checks)).filter(Boolean);
  if (!settings.showServerTitles) return openPorts;
  const titleChecks = openPorts.map(({ ip, port }) => fetchTitle(ip, port));
  return (await Promise.all(titleChecks)).filter(Boolean);
}

async function promptForPorts(win) {
  const result = await dialog.showMessageBox(win, {
    type: 'question',
    buttons: [t('portDialog.buttons.scanAll'), '8000', '8080', '3000', '5000', t('portDialog.buttons.customPort')],
    title: t('portDialog.title'),
    message: t('portDialog.message'),
    cancelId: 0,
  });

  if (result.response === 5) {
    return new Promise((resolve) => {
      const customPortWin = new BrowserWindow({
        width: 400,
        height: 320,
        parent: win,
        modal: true,
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          devTools: false
        },
      });

      customPortWin.loadFile(getLocalizedPath('custom-port.html'));

      ipcMain.once('submit-custom-port', (event, port) => {
        customPortWin.close();
        resolve([port]);
      });

      ipcMain.once('cancel-custom-port', () => {
        customPortWin.close();
        resolve(settings.defaultPorts);
      });

      customPortWin.on('closed', () => {
        resolve(settings.defaultPorts);
      });
    });
  }

  switch (result.response) {
    case 1: return [8000];
    case 2: return [8080];
    case 3: return [3000];
    case 4: return [5000];
    default: return settings.defaultPorts;
  }
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    fullscreen: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools : true,
    },
  });

  await win.loadFile(getLocalizedPath('loading.html'));

  const portsToScan = await promptForPorts(win);
  const foundList = await scanForServers(portsToScan);

  const hasUnsafe = portsToScan.some(port => unsafePorts.includes(port));

  if (hasUnsafe && settings.blockUnsafePorts) {
    return await win.loadFile(getLocalizedPath('unsafe.html'));
  }

  if (foundList.length > 0) {
    if (foundList.length === 1 && settings.autoOpenIfSingleResult) {
      win.loadURL(`http://${foundList[0].ip}:${foundList[0].port}`);
    } else {
      await win.loadFile(getLocalizedPath('menu.html'));
      setTimeout(() => {
        win.webContents.send('list-found', foundList);
      }, 500);
    }
  } else {
    win.loadFile(getLocalizedPath('notfound.html'));
  }
}

ipcMain.on('open-server', (event, url) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.loadURL(`http://${url}`);
});

ipcMain.on('rescan-servers', async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  const portsToScan = await promptForPorts(win);
  const foundList = await scanForServers(portsToScan);
  const hasUnsafe = portsToScan.some(port => unsafePorts.includes(port));
  if (hasUnsafe && settings.blockUnsafePorts) {
    return win.loadFile(getLocalizedPath('unsafe.html'));
  }
  win.webContents.send('list-found', foundList);
});


app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
