/**
 * TODO:
 *
 * - upnext track order are not stored correct in DB. Relative track's order is not updated
 * 
 */

(function(){
    'use strict';

    angular.module('soundcloudify.core')
        .service("NowPlaying", NowPlayingService);

    var ORIGIN_LOCAL = 'l';
    var ORIGIN_SERVER = 's';

    var DEFAULT_STATE = {
        currentTrack: false,
        currentIndex: 0,
        playing: false,
        currentTime: 0,
        duration: 0,
        volume: 0.5,
        repeat: 0,
        shuffle: false,
        scrobbleEnabled: false,
        scrobbled: false,
        lastFmInvalid: false
    };

    function NowPlayingService($http, $q, CLIENT_ID, $rootScope, API_ENDPOINT, StorageService, SCConfiguration){

        var isExtension = SCConfiguration.isExtension();
        var isChromeApp = SCConfiguration.isChromeApp();
        var isWeb = SCConfiguration.isWeb();

        var backgroundPage = isExtension ? chrome.extension.getBackgroundPage() : null;

        //local cache, used by CorePlayer, and is watched by AngularJS for changes
        var nowplaying = {
            trackIds: []
        };
        var state = DEFAULT_STATE;

        if (isExtension) {
            state = backgroundPage.mainPlayer.state;
        } else if (isChromeApp) {
            chrome.storage.local.get('playerstate', function(data) {
                state = data['playerstate']
            });
        } else {
            state = JSON.parse(localStorage.getItem('playerstate')) || DEFAULT_STATE;
        }

        //Storage API for simplify IndexedDB interaction
        var Storage = StorageService.getStorageInstance('nowplaying');

        $rootScope.$on('sync.completed', function() {
            loadNowPlayingList();
        });

        loadNowPlayingList();

        return {
            getTrackIds: getTrackIds,
            getTrack: getTrack,
            getTracks: getTracks,
            addTrack: addTrack,
            addTracks: addTracks,
            removeTrack: removeTrack,
            removeAllTracks: removeAllTracks,
            getState: getState,
            saveState: saveState,
            markTrackError: markTrackError
        };

        function loadNowPlayingList() {
            getTracks().then(function(tracks) {
                var trackIds = _.map(tracks, function(track) {
                    return track.uuid;
                });

                nowplaying.trackIds = trackIds;
                _saveTrackIds(trackIds);
            });
        }

        function getTrackIds() {
            return nowplaying;
        }

        function getTrack(uuid) {
            return Storage.getById(uuid);
        }

        function getTracks(callback){
            return Storage.getTracks();
        }

        /**
         * Add a single track to nowplaying list
         */
        function addTrack(track, position) {

            return $q(function(resolve, reject) {

                //we need to do a copy here to ensure each track we add
                //to the playlist will have a unique id
                track = angular.copy(track);
                track.uuid = window.ServiceHelpers.ID();
                track.sync = 0;
                track.deleted = 0;

                var insertAtUuid;

                if (position && nowplaying.trackIds.length >= 1 ) {
                    insertAtUuid = nowplaying.trackIds[position];
                } else {
                    insertAtUuid = nowplaying.trackIds[0];
                }

                if (insertAtUuid) {
                    Storage.getById(insertAtUuid)
                        .then(function(trackAtPosition) {

                            track.order = trackAtPosition.order + 1;
                            Storage.insert(track);

                            if (typeof position !== 'undefined') {
                                
                                nowplaying.trackIds.splice(position, 0, track.uuid);

                                var tobeUpsert = _.filter(nowplaying.trackIds, function(uuid, index) {
                                    return index < position;
                                });

                                if (tobeUpsert.length) {
                                    Storage.increaseOrder(tobeUpsert);
                                }

                                _saveTrackIds(nowplaying.trackIds);
                                resolve();
                            } else {
                                nowplaying.trackIds.unshift(track.uuid);

                                _saveTrackIds(nowplaying.trackIds);
                                resolve();
                            }
                        });
                } else {
                    track.order = 0;
                    nowplaying.trackIds.unshift(track.uuid);
                    Storage.insert(track);

                    _saveTrackIds(nowplaying.trackIds);
                    resolve();
                }


            });
        }

        /**
         * Add multiple tracks to nowplaying
         */
        function addTracks(tracks) {

            return $q(function(resolve, reject) {

                removeAllTracks().then(function() {

                    var tracksToAdd = _.map(tracks, function(track, index) {
                        track = angular.copy(track);
                        track.uuid = window.ServiceHelpers.ID();
                        track.sync = 0;
                        track.deleted = 0;
                        track.order = tracks.length - 1 - index;
                        return track;
                    });

                    nowplaying.trackIds = _.map(tracksToAdd, function(track) {
                        return track.uuid;
                    });

                    _saveTrackIds(nowplaying.trackIds);

                    Storage.insert(tracksToAdd);

                    resolve();
                });

            });

        }

        /**
         * Remove track from now playing
         */
        function removeTrack(position) {
            var uuid = nowplaying.trackIds[position];
            Storage.delete(uuid);
            nowplaying.trackIds.splice(position, 1);
            _saveTrackIds(nowplaying.trackIds);
        }

        /**
         * Remove all tracks from nowplaying
         */
        function removeAllTracks() {
            return $q(function(resolve, reject) {
                Storage.delete(nowplaying.trackIds);
                nowplaying.trackIds = [];
                _saveTrackIds([]);
                resolve();
            });
        }

        /**
         * Save state
         */
        function saveState(newState) {
            state = newState;
            if(isExtension) {
                backgroundPage.mainPlayer.saveState(newState);
            } else if (isChromeApp) {
                chrome.storage.local.set({'playerstate': newState});
            } else {
                localStorage.setItem('playerstate', JSON.stringify(newState));
            }
        }

        /**
         * Get the state getting from the background
         */
        function getState(callback) {
            return state;
        }

        /**
         * mark the track as error
         */
        function markTrackError(track) {
            track.error = true;
            Storage.upsert(track);
        }

        /**
         * save trackIds
         */
        function _saveTrackIds(trackIds) {
            if (trackIds) {
                nowplaying.trackIds = trackIds;
                if (isExtension) {
                    backgroundPage.mainPlayer.saveTrackIds(trackIds);
                } else if (isChromeApp) {
                    chrome.storage.local.set({'nowplaying': trackIds});
                } else {
                    localStorage.setItem('nowplaying', JSON.stringify(trackIds));
                }
            }
        }
    };

}());
