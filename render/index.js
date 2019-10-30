const { ipcRenderer } = require('electron');

let musicAudio = new Audio();
let allTracks;
let currentTrack;
let progressContainer = document.querySelector('#status-container');
let progressBar = document.querySelector('#status-progress-bar');
let aimProgress;

document.querySelector('#add-music-button').addEventListener('click', () => {
    ipcRenderer.send('add-music-window');
});

ipcRenderer.on('add-updated-tracks', (event, tracks) => {
    //渲染index页面
    allTracks = tracks;
    renderListHTML(tracks);
});

const renderListHTML = (tracks) => {
    const list = document.querySelector('#tracks-list-container');
    const listHTML = tracks.reduce((itemsHTMLSum, track) => {
        itemsHTMLSum += `<li class="row list-group-item list-group-item-action d-flex justify-content-between">
        <div class="col-10">
            <i class="fas fa-music"></i>
            <span>${track.musicName}</span>
        </div>
        <div class="col-2 d-flex justify-content-around">
            <i class="fas fa-play" data-id="${track.id}"></i>
            <i class="fas fa-trash-alt" data-id="${track.id}"></i>
        </div>
        </li>`;
        return itemsHTMLSum;
    }, '');
    const emptyHTML = '<div class="alert alert-primary">还没有添加任何音乐</div>';
    list.innerHTML = tracks.length ? `<ul class="list-group">${listHTML}</ul>` : emptyHTML;
};

document.querySelector('#tracks-list-container').addEventListener('click', (event) => {
    event.preventDefault();
    const { dataset, classList } = event.target;
    const id = dataset && dataset.id;
    if(id && classList.contains('fa-play')) {
        //如果点击当前音乐，则继续播放
        if(currentTrack && currentTrack.id === id) {
            musicAudio.play();
        }else {
            //如果点击另一首音乐，则播放新音乐并选中
            currentTrack = allTracks.find(track => track.id === id);
            musicAudio.src = currentTrack.path;
            musicAudio.play();
            const pauseStatus = document.querySelector('.fa-pause');
            if(pauseStatus) {
                pauseStatus.classList.replace('fa-pause', 'fa-play');
            };
            const focusBar = document.querySelector('.list-group-item-success');
            if(focusBar) {
                focusBar.classList.remove('list-group-item-success')
            };
        };
        classList.replace('fa-play', 'fa-pause');
        event.target.parentNode.parentNode.classList.add('list-group-item-success');
    }else if(id && classList.contains('fa-pause')) {
        //如果点击暂停，则暂停当前音乐
        musicAudio.pause();
        classList.replace('fa-pause', 'fa-play');
    }else if(id && classList.contains('fa-trash-alt')) {
        //如果点击删除，则删除该音乐
        ipcRenderer.send('delete-track', id);
    };
});

musicAudio.addEventListener('loadeddata', () => {
    //渲染播放歌曲信息
    renderPlayingStatus(currentTrack.musicName, musicAudio.duration);
});

musicAudio.addEventListener('timeupdate', () => {
    //更新播放状态
    updateProgress(musicAudio.currentTime, musicAudio.duration);
});

const renderPlayingStatus = (musicName, musicDuration) => {
    const player = document.querySelector('#status-info');
    const infoHTML = `<div class="col font-weight-bold">
    正在播放：${musicName}
    </div>
    <div class="col">
        <span id="current-catch">00:00</span> / ${convertDuration(musicDuration)}
    </div>`
    player.innerHTML = infoHTML;
};

const updateProgress = (currentTime, duration) => {
    const progress = Math.floor(currentTime / duration * 100);
    progressBar.innerHTML = progress + '%';
    progressBar.style.width = progress + '%';
    const currentCatch = document.querySelector('#current-catch');
    currentCatch.innerHTML = convertDuration(currentTime);
};

const convertDuration = (time) => {
    //计算分钟数 单数返回 '01' 多位数返回 '010'
    const minutes = "0" + Math.floor(time / 60);
    //计算秒数 单数返回 '01' 多位数返回 '010'
    const seconds = "0" + Math.floor(time - minutes *60);
    return minutes.substr(-2) + ":" + seconds.substr(-2);
};

const turnToAimProgress = (aimPercent) => {
    aimProgress = aimPercent / 100 * musicAudio.duration;
    musicAudio.currentTime = aimProgress;
};

document.querySelector('#status-progress').addEventListener('click', (event) => {
    const id = event.target.id;
    if(id && id === 'status-progress-bar') {
        //倒退音乐
        const clickX = event.clientX;
        const percent = (clickX - progressContainer.offsetLeft - 15) / event.target.parentNode.offsetWidth * 100;
        turnToAimProgress(percent);
    }else {
        //快进音乐
        const percent = (event.clientX - progressContainer.offsetLeft - 15) / event.target.offsetWidth * 100;
        turnToAimProgress(percent);
    };
});