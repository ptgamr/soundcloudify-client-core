(function(){
    'use strict';

    angular.module('soundcloudify.core')
        .service("Category", CategoryService);

    function CategoryService($http, $q, CLIENT_ID, TrackAdapter, API_ENDPOINT, YahooProxy, SCConfiguration){

        var cachedCategory;
        var cachedRedditVideoIds = [];
        var isWeb = SCConfiguration.isWeb();
        var SOUNDCLOUD_API_V2_URL = 'https://api-v2.soundcloud.com';

        return {
            getList: getList,
            getTracks: getTracks,
            getRedditHot: getRedditHot
        };

        function getStoredCharts() {
            return $q(function(resolve, reject) {
                if (SCConfiguration.isChromeApp()) {
                    chrome.storage.local.get('activeTab', function(data) {
                        resolve(data['charts'] || []);
                    });
                } else {
                    resolve(JSON.parse(localStorage.getItem('charts')) || []);
                }                
            });
        }

        function saveCharts(charts) {
            if (SCConfiguration.isChromeApp()) {
                chrome.storage.local.set({'charts': charts});
            } else {
                localStorage.setItem('charts', JSON.stringify(charts));
            }
        }

        function getList(){

            return $q(function(resolve, reject) {

                getStoredCharts().then(function(data) {
                    
                    cachedCategory = data;

                    if (cachedCategory.length) {
                        resolve(cachedCategory);
                    } else {

                        if (isWeb) {

                            var soundcloudParams = { limit: 10, offset: 0, linked_partitioning: 1, client_id: CLIENT_ID };
                            var soundcloudUrl = window.ServiceHelpers.buildUrl(SOUNDCLOUD_API_V2_URL + '/explore/categories', soundcloudParams)

                            YahooProxy
                                .request(soundcloudUrl)
                                .then(function(data) {
                                    cachedCategory = data['music'] || [];
                                    resolve(cachedCategory);
                                    saveCharts(cachedCategory);
                                });

                        } else {
                            var params = { limit: 10, offset: 0, linked_partitioning: 1, client_id: CLIENT_ID };
                            $http.get(SOUNDCLOUD_API_V2_URL + '/explore/categories', { params: params })
                            .success(function(data) {
                                cachedCategory = data['music'] || [];
                                resolve(cachedCategory);
                                saveCharts(cachedCategory);
                            });
                        }

                    }
                });
            });
        }

        function getTracks(category, pagingObject) {

            if (isWeb) {
                var soundcloudParams = { limit: pagingObject.limit, offset: pagingObject.skip, linked_partitioning: 1, client_id: CLIENT_ID };
                var soundcloudUrl = window.ServiceHelpers.buildUrl(SOUNDCLOUD_API_V2_URL + '/explore/' + category, soundcloudParams);

                var customTransform = function(result) {
                    if (!result || !result.tracks) return [];
                    return {
                        tracks: TrackAdapter.adaptMultiple(result.tracks, 'sc')
                    };
                };

                return YahooProxy.request(soundcloudUrl, customTransform);
            } else {
                var params = { limit: pagingObject.limit, offset: pagingObject.skip, linked_partitioning: 1, client_id: CLIENT_ID };

                return $q(function(resolve, reject) {
                    $http({
                        url: SOUNDCLOUD_API_V2_URL + '/explore/' + category,
                        method: 'GET',
                        params: params,
                        transformResponse: ServiceHelpers.appendTransform($http.defaults.transformResponse, function(result) {
                            if (!result || !result.tracks) return [];
                            return {
                                tracks: TrackAdapter.adaptMultiple(result.tracks, 'sc')
                            };
                        })
                    }).success(function(data) {
                        resolve(data);
                    }).error(function() {
                        reject();
                    });
                });
            }
        }

        function getRedditHot(pagingObject) {
            return $q(function(resolve, reject) {

                if (!cachedRedditVideoIds.length) {

                    $http({
                        url: API_ENDPOINT + '/reddit',
                        method: 'GET'
                    }).success(function(videoIds) {

                        cachedRedditVideoIds = videoIds;

                        var pagingVideoIds = angular.copy(cachedRedditVideoIds).splice(pagingObject.skip, pagingObject.limit);
                        getVideosInfo(pagingVideoIds, resolve, reject);

                    }).error(function() {
                        reject();
                    })
                } else {

                    var pagingVideoIds = angular.copy(cachedRedditVideoIds).splice(pagingObject.skip, pagingObject.limit);
                    getVideosInfo(pagingVideoIds, resolve, reject);

                }

            });
        }

        function getVideosInfo(ids, resolve, reject) {

            var parts = ['id', 'snippet', 'statistics', 'status'];
            var fields = [
                'items/id',
                'items/snippet/title',
                'items/snippet/thumbnails',
                'items/statistics/viewCount',
                'items/statistics/likeCount',
                'items/status/embeddable'
            ];

            var requestParam = {
                key: 'AIzaSyDGbUJxAkFnaJqlTD4NwDmzWxXAk55gFh4',
                type: 'video',
                maxResults: ids.length,
                part: parts.join(','),
                fields: fields.join(','),
                id: ids.join(',')
            };

            $http({
                url: 'https://www.googleapis.com/youtube/v3/videos',
                method: 'GET',
                params: requestParam,
                transformResponse: ServiceHelpers.appendTransform($http.defaults.transformResponse, function(result) {
                    if (!result || !result.items) return [];
                    return {
                        tracks: TrackAdapter.adaptMultiple(result.items, 'yt')
                    }
                })
            }).success(function(data) {
                resolve(data);
            }).error(function() {
                reject();
            });

        }
    };

}());
