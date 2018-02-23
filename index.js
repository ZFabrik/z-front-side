const TabGroup = require("electron-tabs")
const dragula = require("dragula")
const electron = require('electron')
const {BrowserWindow} = require('electron')
const contextMenu = require('electron-context-menu')
const loadJsonFile = require('load-json-file')
const jsStringEscape = require('js-string-escape')
const PDFWindow = require('electron-pdf-window')

// Retrieve the electron in page search module
const searchInPage = require('electron-in-page-search').default;
const remote = require('electron').remote;
// // or
// // import searchInPage from 'electron-in-page-search';
//

// build toolbar

var toolbar = document.getElementsByClassName('ztoolbar')[0];
let tabGroup = new TabGroup({
  ready: function (tabGroup) {
    dragula([tabGroup.tabContainer], {
        direction: "horizontal"
    });
  }
});
var activate=false;

// config is set via IPC call
var mainConfig;

// hook up with the main process for initialization
var ipcRenderer = electron.ipcRenderer;
ipcRenderer.on('initialize', (event,config) => {
  mainConfig=config;
//  console.log("received config "+JSON.stringify(config));
  // partitionSpan.innerHTML="("+config.partition+") &nbsp;";
  // set title
  document.title = 'z-front-side'+(config.partition!=null? ' ('+jsStringEscape(config.partition)+')':'');

  // config may be specified by file or inline (for open in window)
  if (config.content!=null) {
    initialize();
  } else {
    // read the config
    console.log("Loading config "+config.configFile);
    loadJsonFile(config.configFile).then(config => {
      if (config.content==null) {
        config.content=[{button:"google",tabTitle:"google",url:"https://www.google.com", preload: 0 }];
      }
      // merge in main config
      mainConfig.content=config.content;
      // initialize
      initialize();
    });
  }
});

// modal
function showModal() {
  document.getElementById('modal').style.display = "block";
}

function hideModal() {
  document.getElementById('modal').style.display = "none";
}

//
// handling of login
//

// a key identifying the current login
var loginKey;
// the main sends us a request to get login data
ipcRenderer.on('get-login-auth', (event,key,request,authInfo) => {
  loginKey = key;
  showLogin(request,authInfo);
});

function showLogin(request,authInfo) {
  showModal();
  getLoginPopup().style.display = "block";
  getLoginInfo().innerHTML=jsStringEscape(request.url);
}

function hideLogin() {
  loginKey=null;
  hideModal();
  getLoginPopup().style.display = "none";
  getLoginPasswordField().value='';
}

// to confirm login
module.exports.onLoginOk=() => {
  var userNameField = getLoginUserNameField();
  var passwordField = getLoginPasswordField();
  // send back to main
  ipcRenderer.send('set-login-auth',loginKey,userNameField.value,passwordField.value);
  // clear
  hideLogin();
};
// to cancel login
module.exports.onLoginCancel=() => {
  // ipcRenderer.send('cancel-login-auth',loginKey);
  hideLogin();
};

function getLoginPopup() {
  return document.getElementById('login_popup');
}
function getLoginInfo() {
  return document.getElementById('login_info');
}
function getLoginUserNameField() {
  return document.getElementById('login_username');
}
function getLoginPasswordField() {
  return document.getElementById('login_password');
}
// end login handling

// maximize handling for single tab view
function hideTabGroupButtons() {
  document.getElementById('etabs-buttons').style.display="none";
  var view = document.getElementById('etabs-views');
  view.className += " maximizedtab";
}

// this only after config has been passed, i.e. when main tells us to init.
function initialize() {

  // load buttons and tabs
  var preloads={};
  for (var i in mainConfig.content) {
    var content = mainConfig.content[i];
    if (content.button!=null) {
      addButton(toolbar,content.button,createTabFunction(content));
    }
    if (content.preload!=null) {
      preloads[content.preload]=content;
    }
  }

  // create initially loaded tabs
  var first=true;
  var keys = Object.keys(preloads).sort();
  for (var x in keys) {
    var key = keys[x];
    var content = preloads[key];
    if (content) {
      var tab = addTab(content.tabTitle,content.url, content.attributes);
      if (first) {
        if (content.maximize) {
          // maximize by hiding the tab buttons
          hideTabGroupButtons();
        }
        tab.activate();
        first = false;
      }
    }
  }
  // after this tabs activate right away
  activate=true;
}

// in order to resolve the unwrap the closure!
function createTabFunction(content) {
  return ()=>{addTab(content.tabTitle,content.url, content.attributes)};
}

// -------------------- pre-init setup --------------


// the loading indicator
var loading = document.createElement('img');
loading.style.float='right';
loading.style.visibility = 'hidden';
loading.src='./loading.gif';
toolbar.appendChild(loading);

function checkLoad() {
  for (var i=0;i<tabGroup.tabs.length;i++) {
    var tab = tabGroup.tabs[i];
    if (tab.webview.isLoading()) {
      loading.style.visibility = 'visible';
      return;
    }
  }
  loading.style.visibility = 'hidden';
}

// back button

addButton(toolbar,"&lt;&lt;back",()=>{
  var tab = tabGroup.getActiveTab();
  if (tab!=null) {
    tab.webview.goBack();
  }
},"left");

// config button

addButton(toolbar,"cfg",()=>{
  electron.shell.openItem(mainConfig.configFile);
},"right");

// --------------------

function addButton(toolbar,title,addFn,float) {
  var button = document.createElement('BUTTON');
  button.innerHTML=title;
  button.onclick=addFn;
  if (float) {
    button.style="float:"+float;
  }
  toolbar.appendChild(button);
}
function addTab(title,src, attributes) {

  // default attributes for every inner webview:
  // the same partition (!), plugins and popups allowed.
  var wva = {
    partition:mainConfig.partition,
    plugins:true,
    allowpopups:true
  };
  // mix-in more attributes, if specified.
  if (attributes) {
    // copy
    for (var p in attributes) {
      wva[p]=attributes[p];
    }
  }

  var tab = tabGroup.addTab({
    title: title,
    src: src,
    visible: true,
    webviewAttributes: wva
  });
  if (activate) {
    tab.activate();
  }

  // allow opening links in external browser
  tab.webview.addEventListener('new-window', (e) => {
   console.log('open-in-window: '+JSON.stringify(e))

    // some defaults that may be risky!
    var options={
      webPreferences: {}
    }
    options.webPreferences.partition = mainConfig.partition;
    options.webPreferences.plugins = true;
    options.webPreferences.nodeIntegration = true;


    if ("foreground-tab"==e.disposition || "background-tab"==e.disposition) {
      // handle as tab
      addTab(title, e.url, options.webPreferences);
    } else {
      // we tell main to open a new instance
      ipcRenderer.send('open-in-window', e, {options:options});
    }
  });


  // loading indicator
  tab.webview.addEventListener('did-start-loading', checkLoad);
  tab.webview.addEventListener('did-stop-loading', checkLoad);
  tab.webview.addEventListener('did-finish-load', checkLoad);
  tab.webview.addEventListener('did-fail-load', checkLoad);
  tab.webview.addEventListener('destroyed',checkLoad);
  tab.webview.addEventListener('crashed',checkLoad);
  tab.webview.addEventListener('close',checkLoad);
  // add CTRL-F event to search
  tab.webview.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {

                searchInPage(tab.webview).openSearchWindow();
            }
        }, false);

  // set context menu
  contextMenu({
    window:tab.webview,
    append: (params,BrowserWindow)=>[{
      label:'back',
      click: ()=> { var tab = tabGroup.getActiveTab();
                    if (tab!=null) {
                        tab.webview.goBack();
                    }
                }
    },{
      label:'reload',
      click: ()=>{tab.webview.reload();}
    },{
      label:'copy document link',
      click: ()=>{electron.clipboard.writeText(tab.webview.src);}
    },{
      label:'open in external browser',
      visible: params.linkURL != null,
      click: ()=>{electron.shell.openExternal(params.linkURL);}
    },{
      label:'open in new tab',
      visible: params.linkURL != null,
      click: ()=>{addTab(title, params.linkURL, attributes);}
    },{
      label:'print',
      click: ()=>{tab.webview.print();}
    }]
  });
  return tab;
}



/*
const protocol = require('url').parse(e.url).protocol
if (protocol === 'http:' || protocol === 'https:') {
  shell.openExternal(e.url)
}
*/
