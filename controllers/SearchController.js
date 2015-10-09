(function() {

    'use strict';

    angular.module('soundcloudify.core')
            .controller('SearchController', SearchController);

    function SearchController ($scope, SearchSingleton) {
        $scope.vm = SearchSingleton;

        $scope.$watch('vm.toggle', function (newVal, oldVal) {
            $scope.vm.onToggled(newVal, oldVal);
        }, true);

        $scope.$watch('vm.search.term', function (newVal) {
            if (!newVal) {
                $scope.vm.resetSearch();
            }
        }, true);
    }
}());
