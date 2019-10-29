const Store = require('electron-store');
const uuidv4 = require('uuid/v4');
const path = require('path');

class DataStore extends Store {
    constructor(settings) {
        super(settings);
        this.tracks = this.get('tracks') || [];
    };
    saveTracks() {
        this.set('tracks', this.tracks);
        return this;
    };
    getTracks() {
        return this.get('tracks') || [];
    };
    addTracks(tracks) {
        const detailTracks = tracks.map(track => {
            return {
                id: uuidv4(),
                path: track,
                musicName: path.basename(track)
            };
        }).filter(track => {
            const currentTrackPath = this.getTracks().map(track => track.path);
            return currentTrackPath.indexOf(track.path) < 0;
        });
        this.tracks = [ ...this.tracks, ...detailTracks ];
        return this.saveTracks();
    };
    deleteTrack(id) {
        this.tracks = this.tracks.filter(track => track.id !== id);
        return this.saveTracks();
    };
};

module.exports = DataStore;