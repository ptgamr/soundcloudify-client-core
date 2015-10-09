(function() {

    'use strict';

    angular.module('soundcloudify.core')
            .service('SearchSingleton', SearchSingleton);

    function SearchSingleton ($q, SuggestionService, CorePlayer, Paginator, SearchService, $filter, GATracker) {

        var vm = this,
            lastSearchTerm;
        vm.searchText    = null;
        vm.suggest   = suggest;
        vm.search = {
            term: ''
        };

        vm.showSuggestion = true;

        vm.recentSearch = JSON.parse(localStorage.getItem('recentSearch')) || [];

        var mixedResults = [];

        vm.toggle = JSON.parse(localStorage.getItem('toggle')) || {
            soundcloud: true,
            youtube: true
        };

        vm.player = CorePlayer;

        vm.filteredResults = [];

        vm.soundcloudPaginator = Paginator.getInstance({
            limit: 10,
            getFirstPage: false,
            pagingFunction: soundcloudPagingFunction,
            pagingSuccess: concatAndMixedResult
        });

        vm.youtubePaginator = Paginator.getInstance({
            limit: 10,
            getFirstPage: false,
            pagingFunction: youtubePagingFunction,
            pagingSuccess: concatAndMixedResult
        });

        vm.resetSearch = function() {
            lastSearchTerm = '';
            vm.filteredResults = [];
        };

        vm.recentSearchClick = function(term) {
            vm.search.term = term;
            vm.selectedItem = term;
            vm.showSuggestion = false;
            vm.getMore(true);
            GATracker.trackSearch('recent search', term);
        };

        vm.getMore = function(newSearch) {

            //if (newSearch && (!vm.search.term || vm.search.term === lastSearchTerm)) return;

            if (!vm.selectedItem || vm.selectedItem.value === '') {
                return;
            }

            var tempRecentSearch = angular.copy(vm.recentSearch);

            if (newSearch) {
                mixedResults = [];
                vm.filteredResults = [];
                vm.showNoResultMessage = false;
                vm.soundcloudPaginator.reset();
                vm.youtubePaginator.reset();

                tempRecentSearch.unshift(vm.selectedItem.value.trim());
                vm.recentSearch = _.uniq(tempRecentSearch).slice(0,5);
                localStorage.setItem('recentSearch', JSON.stringify(vm.recentSearch));

                GATracker.trackSearch('new search', vm.selectedItem.value);
                lastSearchTerm = vm.selectedItem.value;
            } else {
                GATracker.trackSearch('get more', vm.selectedItem.value);
            }

            vm.soundcloudPaginator.moreRows();
            vm.youtubePaginator.moreRows();

            vm.promises = [vm.soundcloudPaginator.lastPromise, vm.youtubePaginator.lastPromise];


        };

        vm.hasMoreRow = function() {
            return vm.filteredResults.length && (vm.soundcloudPaginator.hasMoreRow || vm.youtubePaginator.hasMoreRow);
        };

        vm.onToggled = function(toggle, oldToggle) {
            localStorage.setItem('toggle', JSON.stringify(toggle));
            vm.filteredResults = $filter('filter')(mixedResults, getOriginFilter(toggle));

            if (toggle.soundcloud !== oldToggle.soundcloud) {
                GATracker.trackSearch('toggle filter', 'soundcloud', toggle.soundcloud ? 'on' : 'off');
            }

            if(toggle.youtube !== oldToggle.youtube) {
                GATracker.trackSearch('toggle filter', 'youtube', toggle.youtube ? 'on' : 'off');
            }
        };

        function soundcloudPagingFunction(paginationModel) {
            return SearchService.search(lastSearchTerm, paginationModel);
        }

        function youtubePagingFunction(paginationModel) {
            return SearchService.searchYoutube(lastSearchTerm, paginationModel);
        }

        function concatAndMixedResult(data) {
            mixedResults = mixedResults.concat(data);
            vm.filteredResults = $filter('filter')(mixedResults, getOriginFilter(vm.toggle));

            if(vm.filteredResults.length === 0 &&
                    vm.soundcloudPaginator.lastPromise.$$state.status === 1 &&
                    vm.youtubePaginator.lastPromise.$$state.status === 1) {

                vm.showNoResultMessage = true;
            }
        }

        function suggest (query) {
            return vm.showSuggestion ? SuggestionService.suggest(query) : $q(function(resolve) {
                resolve([]);
                vm.showSuggestion = true;
            });
        }

        function getOriginFilter(toggle) {
            var filter = '';

            if (!toggle) {
                return;
            }

            if (toggle.soundcloud && toggle.youtube) {
                filter = '';
            } else if (toggle.soundcloud) {
                filter += 'sc';
            } else if (toggle.youtube) {
                filter += 'yt';
            }

            return {origin: filter};
        }
    }
}());
