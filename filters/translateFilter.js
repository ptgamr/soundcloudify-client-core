(function() {

    'use strict';

    angular.module('soundcloudify.core')
            .filter('translate', translateFilter);

    function translateFilter() {
        return function(key) {
            return chrome.i18n.getMessage(key);
        };
    }
}());
