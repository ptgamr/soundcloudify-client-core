(function(){
    'use strict';

    angular.module('soundcloudify.core')
        .service("UserService", UserService);

    function UserService($rootScope, $q, $http, API_ENDPOINT, SCConfiguration){
        var user = {
            id: '',
            email: ''
        };

        return {
            init: init,
            getUser: getUser
        };

        function init() {
            chrome.identity.getProfileUserInfo(function(info) {
                user.id = info.id;
                user.email = info.email;

                if (user.id && user.email) {
                    $rootScope.$broadcast('identity.confirm', {
                        identity: info
                    });

                    getUserId().then(function(gid) {
                        if (typeof gid === 'undefined' || gid === null || gid === 'undefined') {
                            $http({
                                url: API_ENDPOINT + '/signup',
                                method: 'POST',
                                data: {
                                    gid: user.id,
                                    email: user.email
                                }
                            }).success(function(user) {
                                if (user.id) {
                                    saveUserId(user.id);
                                }
                            });
                        }
                    });

                }

            });
        }

        function getUser() {
            return user;
        }

        function getUserId() {
            return $q(function(resolve, reject) {

                if (SCConfiguration.isChromeApp()) {

                    chrome.storage.local.get('gid', function(data) {
                        resolve(data['gid']);
                    });

                } else {
                    resolve(localStorage.getItem('gid'));
                }
            });
        }

        function saveUserId(id) {
            if (SCConfiguration.isChromeApp()) {
                chrome.storage.local.set({'gid' : id });
            } else {
                localStorage.setItem('gid', id);
            }
        }
    };

}());
