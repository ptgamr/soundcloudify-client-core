(function() {
    'use strict';

    function loadingDirective(SCConfiguration) {

        var initParams = function($scope) {
            $scope.ver = $scope.variation || 4;
        };

        return {
            restrict: 'E',
            scope: {
                'variation': '@'
            },
            templateUrl: SCConfiguration.getDirectiveViewPath() + '/loadingDirective.html',
            link : function($scope) {
                initParams($scope);
            }
        };
    };

    var commonModule = angular.module('soundcloudify.core');
    commonModule.directive('loading', loadingDirective);
}());
