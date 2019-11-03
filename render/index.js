const { ipcRenderer } = require('electron');

let musicAudio = new Audio();
let allTracks;
let currentTrack;
let progressContainer = document.querySelector('#status-container');
let progressBar = document.querySelector('#status-progress-bar');
let aimProgress;
let playModeIcon;
let playModeStatus = "fa-stream";

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
        <div class="col-2 d-flex justify-content-around align-items-center">
            <i class="fas fa-play" data-id="${track.id}"></i>
            <i class="fas fa-trash-alt" data-id="${track.id}"></i>
        </div>
        </li>`;
        return itemsHTMLSum;
    }, '');
    const emptyHTML = '<div class="alert alert-primary">还没有添加任何音乐</div>';
    list.innerHTML = tracks.length ? `<ul class="list-group">${listHTML}</ul>` : emptyHTML;
};

const changeIconToPlay = () => {
    const pauseStatus = document.querySelector('.fa-pause');
    if(pauseStatus) {
        pauseStatus.classList.replace('fa-pause', 'fa-play');
    };
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
            changeIconToPlay();
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
    const infoHTML = `<div class="col-8 font-weight-bold">
    正在播放：${musicName}
    </div>
    <div class="col-4 d-flex justify-content-around align-items-center">
        <div>
            <span id="current-catch">00:00</span> / ${convertDuration(musicDuration)}
        </div>
        <i class="fas ${playModeStatus}" id="play-mode"></i>
    </div>`
    player.innerHTML = infoHTML;
    playModeIcon = document.querySelector('#play-mode');
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

document.body.addEventListener('keydown', (event) => {
    if(event.keyCode === 32) {
        event.preventDefault();
    };
});

document.body.addEventListener('keyup', (event) => {
    //空格暂停或继续播放
    if(event.keyCode === 32) {
        if(musicAudio.paused) {
            musicAudio.play();
            document.querySelector('.list-group-item-success .fa-play').classList.replace('fa-play', 'fa-pause');
        }else {
            musicAudio.pause();
            changeIconToPlay();
        };
    };
});

const changeHighlight = () => {
    document.querySelector('.list-group-item-success').classList.remove('list-group-item-success');
    const playIcon = document.querySelector(`[data-id = '${currentTrack.id}']`);
    playIcon.classList.replace('fa-play', 'fa-pause');
    playIcon.parentNode.parentNode.classList.add('list-group-item-success');
};

musicAudio.addEventListener('ended', () => {
    //根据用户选择，判断：顺序播放、单曲循环或随机播放
    if(playModeIcon.classList.contains('fa-stream')) {
        changeIconToPlay();
        //按顺序播放下一首
        ipcRenderer.send('get-next-music', currentTrack);
        ipcRenderer.on('next-music', (event, nextMusicTrack) => {
            currentTrack = nextMusicTrack;
            musicAudio.src = currentTrack.path;
            musicAudio.play();
            changeHighlight();
        });
    }else if(playModeIcon.classList.contains('fa-sync-alt')) {
        musicAudio.play();
    }else if(playModeIcon.classList.contains('fa-random')) {
        changeIconToPlay();
        //随机播放下一首
        ipcRenderer.send('get-random-music');
        ipcRenderer.on('random-music', (event, randomMusicTrack) => {
            currentTrack = randomMusicTrack;
            musicAudio.src = currentTrack.path;
            musicAudio.play();
            changeHighlight();
        });
    };
});

document.querySelector('#status-info').addEventListener('click', (event) => {
    event.preventDefault();
    //切换播放模式
    const { id, classList } = event.target;
    if(id && id === 'play-mode') {
        if(classList.contains('fa-stream')) {
            classList.replace('fa-stream', 'fa-sync-alt');
            playModeStatus = "fa-sync-alt";
        }else if(classList.contains('fa-sync-alt')) {
            classList.replace('fa-sync-alt', 'fa-random');
            playModeStatus = "fa-random";
        }else if(classList.contains('fa-random')) {
            classList.replace('fa-random', 'fa-stream');
            playModeStatus = "fa-stream";
        };
    };
});