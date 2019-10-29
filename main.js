const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const DataStore = require('./render/store');

const myStore = new DataStore({'name': 'Music Data'});
class AppWindow extends BrowserWindow {
    constructor(config, fileURL) {
      const basicConfig = {
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: true
        }
      };
      const finalConfig = { ...basicConfig, ...config };
      super(finalConfig);
      this.loadFile(fileURL);
      this.once('ready-to-show', () => {
        this.show();
      });
    };
};

app.on('ready', () => {
    const mainWindow = new AppWindow({}, './render/index.html');
    //以后再写： 页面准备完成时渲染歌曲列表
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.send('add-updated-tracks', myStore.getTracks());
    });

    //打开子页面
    let addWindow;
    ipcMain.on('add-music-window', () => {
        addWindow = new AppWindow({
            width: 500,
            height: 400,
            parent: mainWindow
        }, './render/add.html');
    });

    //弹出音乐文件选择对话框，并返回所选文件路径
    ipcMain.on('open-file-dialog', (event) => {
        dialog.showOpenDialog({ 
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'Music', extensions: ['mp3', 'wma', 'ogg'] }]
        }).then(result => {
            event.sender.send('selected-files', result.filePaths);
            mainWindow.focus();
        });
    });

    ipcMain.on('add-tracks', (event, musicTracks) => {
      //添加音乐文件路径
        addWindow.close();
        const updatedTracks = myStore.addTracks(musicTracks).getTracks();
        mainWindow.send('add-updated-tracks', updatedTracks);
    });

    ipcMain.on('delete-track', (event, id) => {
      updatedTracks = myStore.deleteTrack(id).getTracks();
      mainWindow.send('add-updated-tracks', updatedTracks);
    });
});