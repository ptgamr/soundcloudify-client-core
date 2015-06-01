(function() {

    'use strict';

    angular.module('soundcloudify.core').provider('SCConfiguration', SCConfigurationProvider);

    function SCConfigurationProvider() {

        var client = 'ext'; //extension | web | app
        var directiveViewPath = 'scripts/core/views';

        this.configureClient = function(_client_) {
            client = _client_;
        }

        this.configureDirectiveViewPath = function(path) {
            directiveViewPath = path;
        }

        this.$get = $get;

        function $get() {
            return {
                getDirectiveViewPath: function() {
                    return directiveViewPath;
                },
                getClient: function() {
                    return client;
                },
                isExtension: function() {
                    return client === 'ext';
                },
                isWeb: function() {
                    return client === 'web';
                },
                isApp: function() {
                    return client === 'app';
                },
                isChromeApp: function() {
                    return client === 'chromeapp';
                }
            }
        }
    }

})();