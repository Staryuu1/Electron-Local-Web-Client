// main.js
const { app, BrowserWindow, dialog } = require('electron');
const os = require('os');
const net = require('net');
const path = require('path');

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        const subnet = net.address.split('.').slice(0, 3).join('.');
        for (let i = 1; i <= 254; i++) {
          ips.push(`${subnet}.${i}`);
        }
      }
    }
  }

  return ips;
}

function checkPortOpen(ip, port, timeout = 1000) {
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

async function scanForLaravel(ports) {
  const ips = getLocalIPs();
  const checks = [];

  for (const ip of ips) {
    for (const port of ports) {
      checks.push(checkPortOpen(ip, port));
    }
  }

  const results = await Promise.all(checks);
  return results.filter(Boolean);
}

async function promptForPorts(win) {
  const result = await dialog.showMessageBox(win, {
    type: 'question',
    buttons: ['Scan Semua', '8000', '8080', '3000', '5000'],
    title: 'Pilih Port',
    message: 'Pilih port yang ingin dipindai:',
    cancelId: 0,
  });

  switch (result.response) {
    case 1:
      return [8000];
    case 2:
      return [8080];
    case 3:
      return [3000];
    case 4:
      return [5000];
    default:
      return [8000, 8080, 3000, 5000];
  }
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    fullscreen: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      devTools: false
    },
  });

  win.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['i', 'j', 'k'].includes(input.key.toLowerCase())) {
      event.preventDefault();
    }
  });

  await win.loadFile('loading.html');

  const portsToScan = await promptForPorts(win);
  const found = await scanForLaravel(portsToScan);

  if (found.length > 0) {
    const { ip, port } = found[0];
    win.webContents.send('web-server-found', `${ip}:${port}`);

    setTimeout(() => {
      win.loadURL(`http://${ip}:${port}`);
    }, 3000);
  } else {
    win.loadFile('notfound.html');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
