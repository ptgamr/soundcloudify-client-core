(function() {

    'use strict';

    window.ServiceHelpers = window.ServiceHelpers || {};

    window.ServiceHelpers.appendTransform = function appendTransform(defaults, transform) {

        // We can't guarantee that the default transformation is an array
        defaults = angular.isArray(defaults) ? defaults : [defaults];

        // Append the new transformation to the defaults
        return defaults.concat(transform);
    };

    window.ServiceHelpers.buildUrl = function(url, params) {
        var paramPairs = [];
        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                paramPairs.push(key + '=' + encodeURIComponent(params[key]));
            }
        }

        return url + '?' + paramPairs.join('&');
    };

    // Generate unique IDs for use as pseudo-private/protected names.
    // Similar in concept to
    // <http://wiki.ecmascript.org/doku.php?id=strawman:names>.
    //
    // The goals of this function are twofold:
    //
    // * Provide a way to generate a string guaranteed to be unique when compared
    //   to other strings generated by this function.
    // * Make the string complex enough that it is highly unlikely to be
    //   accidentally duplicated by hand (this is key if you're using `ID`
    //   as a private/protected name on an object).
    //
    // Use:
    //
    //     var privateName = ID();
    //     var o = { 'public': 'foo' };
    //     o[privateName] = 'bar';
    window.ServiceHelpers.ID = function() {
        // Math.random should be unique because of its seeding algorithm.
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        return '_' + Math.random().toString(36).substr(2, 9);
    };

    var core = angular.module('soundcloudify.core', ['ngMaterial', 'ngRoute', 'ui.router', 'react', 'indexedDB']);

    core.value('API_ENDPOINT', 'http://api.getsoundcloudify.com');

    //SoundCloud API key
    core.value('CLIENT_ID', '458dac111e2456c40805cd838f4548c1');

    //YouTube API key
    core.value('YOUTUBE_KEY', 'AIzaSyDGbUJxAkFnaJqlTD4NwDmzWxXAk55gFh4');
}());
