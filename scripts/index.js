const storage = require('electron-json-storage');
const {
    app,
    BrowserWindow
} = require('electron');
const { autoUpdater } = require('electron')



let win;
var path = require('path');

app.on('ready', function() {
  win = new BrowserWindow({
        width: 1280,
        height: 720,
        icon: path.join(__dirname, './build/icon.icns')
  })
  win.loadURL(`file:///${__dirname}/../LogIn.html`)
  win.on('closed', () => {
    win = null
  	storage.clear(function(error) {
    	if (error) throw error;
  	});
  })
});﻿
