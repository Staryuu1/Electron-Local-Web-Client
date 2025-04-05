const { app, BrowserWindow } = require('electron');
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

async function scanForServer(ports = [8000, 8080, 3000, 5000]) {
  const ips = getLocalIPs();
  const checks = [];

  for (const ip of ips) {
    for (const port of ports) {
      checks.push(checkPortOpen(ip, port));
    }
  }

  const results = await Promise.all(checks);
  return results.filter(Boolean); // filter out null
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  await win.loadFile('loading.html');

  const found = await scanForServer();

  if (found.length > 0) {
    const { ip, port } = found[0];
    win.webContents.send('server-found', `${ip}:${port}`);

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