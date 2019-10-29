const { ipcRenderer } = require('electron');
const path = require('path');

let musicTracks = [];

document.querySelector('#select-music').addEventListener('click', () => {
    //弹出文件选择对话框
    ipcRenderer.send('open-file-dialog');
});

ipcRenderer.on('selected-files', (event, paths) => {
    if (Array.isArray(paths) && paths.length > 0) {
        renderListHTML(paths);//渲染列表
        musicTracks = paths;//将路径数据赋值给变量，供后期传输时使用
    };
});

document.querySelector('#add-tracks').addEventListener('click', () => {
    ipcRenderer.send('add-tracks', musicTracks);//将路径数据传输到main
});


const renderListHTML = (files) => {
    const list = document.querySelector('#music-list');
    const listHTML = files.reduce((itemsHTMLSum, music) => {
        itemsHTMLSum += `<li class="list-group-item list-group-item-primary list-group-item-action">${path.basename(music)}</li>`;
        return itemsHTMLSum;
    }, '');
    list.innerHTML = `<ul class="list-group">${listHTML}</ul>`
};