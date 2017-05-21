const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')

let win

//
//  handle command line. Turn all --x=y into {x:y}.
//
var args = {};

if (process.argv.length>0) {
  var last;
  for (var i=0;i<process.argv.length;i++) {
    var p = process.argv[i];
    if (p.indexOf("--")==0) {
      last = p.substring(2,p.length);
      // default
      args[last]=true
    } else {
      if (last!=null) {
        args[last]=p;
        last=null;
      }
    }
  }
}

var partition=args['partition'];
var configFile=args['config'];

//
// standard wiring
//
app.on('ready', initialize)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    initialize()
  }
})

// reload upon call from child
ipcMain.on('reload', (event, arg) => {
  console.log("reloading...")
  if (win!=null) {
    win.reload();
  }
})

function initialize() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1024,
    height: 600,
    icon:'zshell.png',
    webPreferences: {
      partition:partition
    }
  })

  // load config

  if (!configFile) {
    configFile=path.dirname(process.execPath)+'/default.json';
  }

  // load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // tell the browser window to initialize
  win.webContents.on('did-finish-load', ()=>{
   /*
    Pass config to renderer which will initialize after receiving
    */
    win.webContents.send('initialize', {
      configFile:configFile,
      partition:partition
    });
  });

  // Open the DevTools.
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

}
