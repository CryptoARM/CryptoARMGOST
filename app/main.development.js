const { app, BrowserWindow, Tray, Menu, protocol } = require('electron');
const { handlePossibleProtocolLauncherArgs,
  setAsDefaultProtocolClient, parseUrlCommandApiV7 } = require('./parse-app-url.ts');

let mainWindow = null;
let preloader = null;
const isMAS = process.mas === true;
const isMacOS = process.platform === "darwin";
let gotInstanceLock = false;
const possibleProtocols = new Set(['cryptoarm']);

let delayedUrl = "";

global.globalObj = {
  id: 123,
  launch: null,
};

// requestSingleInstance causes the MAS build to quit on startup
if (!isMAS) {
  gotInstanceLock = app.requestSingleInstanceLock();
}

const path = require('path');

function restoreWin(win) {
  if (win && win instanceof BrowserWindow) {
    if (win.isMinimized()) {
      win.restore();
    }

    win.show();
    win.focus();

    if (isMacOS) {
      app.dock.show();
    }
  }
}

function utilShowWindow() {
  if (mainWindow) {
    mainWindow.show();

    if (isMacOS) {
      app.dock.show();
    }
  }
}

let trayIcon;
let trayMenu;

function createMainWindow() {
  if (mainWindow && mainWindow instanceof BrowserWindow) {
    restoreWin(mainWindow);
    return;
  }

  let iconPath;
  switch (process.platform) {
    case "win32":
      iconPath = 'resources/cryptoarm-gost.ico';
      break;

    case "linux":
      iconPath = 'resources/cryptoarm-gost.png';
      break;

    case "darwin":
      iconPath = 'resources/cryptoarm-gost.icns';
      break;
  }

  mainWindow = new BrowserWindow({
    minWidth: 900, minHeight: 700,
    width: 900, height: 700,
    frame: false,
    toolbar: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    },
    icon: path.join(__dirname, iconPath)
  });


  preloader = new BrowserWindow({
    alwaysOnTop: false,
    width: 496, height: 149,
    resizable: false,
    frame: false,
    toolbar: false,
    show: false,
    icon: path.join(__dirname, iconPath)
  });

  mainWindow.loadURL(`file://${__dirname}/resources/index.html`);
  preloader.loadURL(`file://${__dirname}/resources/preloader_index.html`);

  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true' || options.indexOf("devtools") !== -1) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }

  const platform = require('os').platform();
  const lang = app.getLocale().split("-")[0];


  if (platform == 'win32') {
    trayIcon = new Tray(__dirname + '/resources/image/tray.ico');
  } else if (platform == 'darwin') {
    trayIcon = new Tray(__dirname + '/resources/image/tray_mac.png');
  } else {
    trayIcon = new Tray(__dirname + '/resources/image/tray.png');
  }

  const trayMenuTemplate = [
    {
      label: lang === 'ru' ? 'Открыть приложение' : 'Open Application',
      click: utilShowWindow
    },
    {
      label: lang === 'ru' ? 'Выйти' : 'Close',
      click: function () {
        global.sharedObject.isQuiting = true;
        app.quit();
      }
    }
  ];

  trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
  trayIcon.setContextMenu(trayMenu);

  trayIcon.on('click', utilShowWindow);
  trayIcon.on('double-click', utilShowWindow);

  if (isMacOS) {
    app.dock.setMenu(trayMenu);
  }

  var startMinimized = (process.argv || []).indexOf('--service') !== -1;

  startMinimized = false; //Временно

  if (startMinimized == true) {
    //console.log('App is started by AutoLaunch');
    globalObj.launch = true;
    if (mainWindow) mainWindow.hide();
  } else {
    globalObj.launch = false;
    //console.log('App is started by User');
  }

  preloader.webContents.on("did-finish-load", () => {
    preloader.show();
    preloader.focus();
  });

  preloader.on("close", function () {
    preloader = null;
  });

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    preloader.close();
    if (!startMinimized) {
      mainWindow.show();
      mainWindow.focus();
    }

    if (delayedUrl.length !== "") {
      const urlToProcess = delayedUrl;
      handleAppURL(urlToProcess);
      delayedUrl = "";
    }

    const urlToProcess = handlePossibleProtocolLauncherArgs(options, possibleProtocols);
    if (urlToProcess !== "") {
      handleAppURL(urlToProcess);
    }
    mainWindow.webContents.send("cmdArgs", options);
  });

  mainWindow.on('close', function (event) {
    if (!global.sharedObject.isQuiting) {
      event.preventDefault();
      mainWindow.hide();

      if (isMacOS) {
        app.dock.hide();
      }
    }

    return false;
  });
}

if (!gotInstanceLock && !isMAS) {
  app.quit();
} else {
  if (!isMAS) {
    app.on('second-instance', (e, argv) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }

        mainWindow.show();
        mainWindow.focus();

        const urlToProcess = handlePossibleProtocolLauncherArgs(argv, possibleProtocols);
        if (urlToProcess !== "") {
          handleAppURL(urlToProcess);
        }

        mainWindow.webContents.send("cmdArgs", argv);
      }
    });
  }

  if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
  }

  var options = process.argv;

  if (options.indexOf('logcrypto') !== -1) {
    global.sharedObject = { logcrypto: true };
  } else {
    global.sharedObject = { logcrypto: false };
  }

  global.sharedObject.isQuiting = false;

  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    require('electron-debug')();
    const p = path.join(__dirname, '..', 'app', 'node_modules');
    require('module').globalPaths.push(p);
  }


  app.on('ready', async () => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
      await installExtensions();
    }

    createMainWindow();

    protocol.registerHttpProtocol('urn', (request, callback) => {
      callback({ url: request.url, method: request.method });
    });

    possibleProtocols.forEach(protocol => setAsDefaultProtocolClient(protocol));

    if (process.platform === 'darwin') {
      // Create our menu entries so that we can use MAC shortcuts
      const template = [
        {
          label: app.getName(), submenu: [
            {
              label: 'Quit',
              click: function () {
                global.sharedObject.isQuiting = true;
                app.quit();
              }
            },
          ],
        },
        {
          label: 'Edit', submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'pasteandmatchstyle' },
            { role: 'delete' },
            { role: 'selectall' },
          ],
        },
        {
          label: 'Help', submenu: [
            {
              role: 'help',
              click() { require('electron').shell.openExternal('https://cryptoarm.ru/upload/docs/userguide-cryptoarm-gost.pdf') }
            }
          ],
        },
      ];

      Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('activate', () => {
    if (app.isReady()) {
      createMainWindow();
    }
  });

  app.on('will-finish-launching', () => {
    // macOS only
    app.on('open-url', (event, url) => {
      event.preventDefault()

      if (mainWindow) {
        handleAppURL(url);
      } else {
        delayedUrl = url;
      }
    })
  })

  app.on('web-contents-created', (event, win) => {
    win.on('new-window', (event, newURL, frameName, disposition,
      options, additionalFeatures) => {
      if (!options.webPreferences) options.webPreferences = {};
      options.webPreferences.nodeIntegration = false;
      options.webPreferences.nodeIntegrationInWorker = false;
      options.webPreferences.webviewTag = false;
      delete options.webPreferences.preload;
    })
  })

  app.on('before-quit', function (evt) {
    global.sharedObject.isQuiting = true;

    if (trayIcon != null) {
      trayIcon.destroy();
      trayIcon = null;
    }
  });
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};

function handleAppURL(url) {
  const parsedCommand = parseUrlCommandApiV7(url);
  if (parsedCommand.command !== "not supported") {
    mainWindow.webContents.send('url-command', { command: parsedCommand });
    return;
  }
}




