(function() {

    'use strict';

    angular.module('soundcloudify.core')
            .controller('ChartsViewController', ChartsViewController);

    function ChartsViewController($scope, Category, $state, $stateParams, CorePlayer, Paginator, $mdToast, GATracker, SCConfiguration) {
        var vm = this;
        var DEFAULT_ARTWORK = 'images/artwork-default.jpg';
        vm.category = $stateParams.category;

        if (!vm.category) {
            throw new Error('ChartsViewController: category is undefined');
        }

        vm.fallbackArtwork = SCConfiguration.isExtension() ? chrome.extension.getURL(DEFAULT_ARTWORK) : DEFAULT_ARTWORK;
        vm.tracks = [];

        vm.paginator = Paginator.getInstance({
            limit: 10,
            getFirstPage: true,
            pagingFunction: function(paginationModel) {
                if (vm.category === 'reddit') {
                    return Category.getRedditHot(paginationModel);
                } else {
                    return Category.getTracks(vm.category, paginationModel);
                }
            },
            pagingSuccess: function(data) {
                vm.tracks = vm.tracks.concat(data);
            }
        });

        vm.paginator.moreRows();

        vm.backToTopChart = function() {
            $state.go('charts.list');
        };

        $scope.$on('charts.playAll', function() {

            GATracker.trackDiscovery('play all', vm.category);

            if (!vm.tracks.length) {
                $mdToast.show(
                  $mdToast.simple()
                    .content('No track to play')
                    .position('bottom right')
                    .parent(angular.element(document.querySelector('#tab-content')))
                    .hideDelay(2000)
                );
                return;
            }

            CorePlayer.playAll(vm.tracks);

            $mdToast.show(
                  $mdToast.simple()
                    .content('All tracks has been addded to Now Playing list')
                    .position('bottom right')
                    .parent(angular.element(document.querySelector('#tab-content')))
                    .hideDelay(2000)
                );
        });
    }
}());
