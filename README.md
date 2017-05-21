# zshell

A simple browser shell to manage web apps in a native wrapper based on electron. This is not a browser replacement, but rather a "native-web-app" enabler so that 

* your most needed web sites keep logins and sesisons independently from your main browser
* have a completely independent, persistent, application style web application experience

# Introduction

It is supposed to have as little features as possible. It does however

* have file-based configuration for menu and pre-loaded sites
* supports multiple chrome partitions (so that multiple login sessions can be used independently)
* a back button
* a loading-indicator
* a context menu to copy URLs
* handling of external URLs in external browser.

It does not yet have a basic-auth popup (https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-login)

# How-To Install

Basically it is clone, build, run:

