(function() {

    'use strict';

    angular.module('soundcloudify.core')
            .controller('DiscoveryController', DiscoveryController);

    function DiscoveryController($scope, $q, $mdSidenav, $state, $timeout, SCConfiguration) {
        var vm = this;

        var states = ['nowPlaying', 'search', 'playlist.list', 'charts.list'];

        getActiveTab().then(function(activeTab) {
            vm.selectedIndex = isNaN(activeTab) ? 3 : activeTab;
        });

        vm.onTabSelect = function() {
            $timeout(function() {
                saveActiveTab(vm.selectedIndex);
                $state.go(states[vm.selectedIndex]);
            });
        };

        function getActiveTab() {
            return $q(function(resolve) {
                if (SCConfiguration.isChromeApp()) {
                    chrome.storage.local.get('activeTab', function(data) {
                        resolve(data.activeTab);
                    });
                } else {
                    resolve(parseInt(localStorage.getItem('activeTab')));
                }
            });
        }

        function saveActiveTab(index) {
            if (SCConfiguration.isChromeApp()) {
                chrome.storage.local.set({'activeTab': index});
            } else {
                localStorage.setItem('activeTab', vm.selectedIndex);
            }
        }
    }
}());
