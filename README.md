# zshell

A simple browser shell to manage web apps in a native wrapper based on electron. This is not a browser replacement, but rather a "native-web-app" enabler so that 

* your most needed web sites keep logins and sesisons independently from your main browser
* have a completely independent, persistent, application style web application experience

# Introduction

It is supposed to have as little features as possible. It is not meant to be interactively, easily configurable. It is not meant to be very much visible as such. It does however

* have file-based configuration for menu and pre-loaded sites
* supports multiple chrome partitions (so that multiple login sessions can be used independently)
* a back button
* a loading-indicator
* a context menu to copy URLs
* handling of external URLs in external browser.
* drag-and-droppable tabs

It does not yet have a basic-auth popup (https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-login)

# How-To Install

Basically it is clone, build, run:

```
  git clone https://github.com/ZFabrik/zshell.git
  cd zshell
  npm install
  node_modules/.bin/electron . --config ./sample_config.json
```

Obviously you need to have node / npm installed (http://blog.npmjs.org/post/85484771375/how-to-install-npm)

  
# Parameters

--partition &lt;partition&gt;

Set the chrome partition. The isolated session namespace for this instance. Will not be shared.

--config &lt;config&gt;

The config file. See sample_config.json for an example or below.

# Configuration

The configuration file is a simple json file naming sites that made available in the menu ("button") will be opened in a tab ("tabTitle") and may possibly be preloaded at start ("preload"). The "preload" value defines the preload order.

```
  {
    "content":[
      {
        "button": "Google",
        "tabTitle": "Google",
        "url": "https://www.google.com",
        "preload":0
      },
      {
        "button": "JIRA",
        "tabTitle": "JIRA@ACME",
        "url": "https://jira.acme.com",
        "preload":1
      }
      {
        "button": "Not So Important",
        "tabTitle": "N.I.",
        "url": "https://not-so-important.acme.com"
      }
    ]
  }	
```
