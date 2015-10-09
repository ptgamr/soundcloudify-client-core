(function() {

    'use strict';

    angular.module('soundcloudify.core')
            .controller('PlaylistController', PlaylistController);

    function PlaylistController($mdToast, $mdDialog, $state, $scope, PlaylistService, PlaylistImporter, StarService, CorePlayer, GATracker) {
        var vm = this;

        vm.playlists = PlaylistService.getList();
        vm.starredListLength = StarService.getLength();

        $scope.$on('starredList.ready', function() {
            vm.starredListLength = StarService.getLength();
        });

        vm.newPlaylistName = '';

        vm.addNew = function(keyEvent) {

            if (keyEvent.which !== 13) {
                return;
            }

            if (!vm.newPlaylistName) {
                return;
            }
            PlaylistService.newPlaylist(vm.newPlaylistName).then(function() {
                vm.newPlaylistName = '';
                GATracker.trackPlaylist('add new');
            });
        };

        vm.remove = function($event, index) {
            $event.stopPropagation();
            PlaylistService.removePlaylist(index);

            GATracker.trackPlaylist('remove at', index);
        };

        vm.playAll = function($event, index) {
            $event.stopPropagation();

            var playlist = PlaylistService.getPlaylist(index);

            if (!playlist.tracks.length) {
                $mdToast.show(
                  $mdToast.simple()
                    .content('No track to play')
                    .position('bottom right')
                    .parent(angular.element(document.querySelector('#tab-content')))
                    .hideDelay(2000)
                );
                return;
            }

            CorePlayer.playAll(playlist.tracks);

            GATracker.trackPlaylist('play all', index);
        };

        vm.playAllListView = function() {
            $scope.$broadcast('playlist.playAll');
        };

        vm.selectPlaylist = function(index) {
            $state.go('playlist.view', {playlistIndex: index});
        };

        vm.openImportModal = function($event) {
            showDialog($event);

            function showDialog($event) {
                var parentEl = angular.element(document.body);

                $mdDialog.show({
                    parent: parentEl,
                    targetEvent: $event,
                    templateUrl: 'scripts/core/views/import.html',
                    controller: PlaylistImportDialogController
                });

                function PlaylistImportDialogController(scope, $mdDialog) {
                    scope.newPlaylistName = '';
                    scope.playlistUrl = '';
                    scope.invalidUrl = false;
                    scope.playlistNotFound = false;
                    scope.loadedTracks = null;
                    scope.loading = false;

                    scope.$watch('playlistUrl', function(newVal) {

                        if (newVal && PlaylistImporter.extractPlaylistId(newVal)) {
                            scope.invalidUrl = false;
                            scope.playlistNotFound = false;

                            var playlistId = PlaylistImporter.extractPlaylistId(newVal);

                            if (!playlistId) {
                                scope.invalidUrl = true;
                                return;
                            }

                            scope.loading = true;

                            PlaylistImporter.fetchPlaylist(playlistId)
                                .then(function(playlist) {

                                    if(playlist) {
                                        scope.newPlaylistName = playlist.name;

                                        PlaylistImporter.fetchPlaylistItems(playlistId)
                                            .then(function(youtubeVideos) {
                                                scope.loadedTracks = youtubeVideos;
                                                scope.loading = false;
                                            });
                                    } else {
                                        scope.playlistNotFound = true;
                                        scope.loading = false;
                                    }

                                }, function() {
                                    scope.playlistNotFound = true;
                                    scope.loading = false;
                                });
                        } else if (newVal) {
                            scope.invalidUrl = true;
                        } else {
                            scope.invalidUrl = false;
                        }
                    });

                    scope.createPlaylist = function() {

                        if (!scope.newPlaylistName) {
                            return;
                        }

                        PlaylistService.newPlaylist(scope.newPlaylistName, scope.loadedTracks || [])
                            .then(function() {
                                $mdDialog.hide();
                            });
                    };

                    scope.cancel = function() {
                        $mdDialog.hide();
                    };
                }
            }
        };
    }
}());
