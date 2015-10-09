(function(){
    'use strict';

    angular.module('soundcloudify.core')
        .directive('toggleButton', toggleButton);

    function toggleButton() {
        return {
            restrict: 'A',
            link: function(scope, element, attr) {

                var toggleClass = 'md-primary';

                attr.$observe('toggleButton', function(val) {
                    if (val === 'true') {
                        element.addClass(toggleClass);
                    } else {
                        element.removeClass(toggleClass);
                    }
                });

                element.on('click', function() {
                    element.toggleClass(toggleClass);
                });
            }
        };
    }
}());
