(function() {

    'use strict';

    angular.module('soundcloudify.core').provider('SCConfiguration', SCConfigurationProvider);

    function SCConfigurationProvider() {

        var client = 'ext'; //extension | web | app

        this.configureClient = function(_client_) {
            client = _client_;
        }

        this.$get = $get;

        function $get() {
            return {
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
                }
            }
        }
    }

})();