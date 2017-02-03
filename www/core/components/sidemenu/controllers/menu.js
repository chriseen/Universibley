// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.core.sidemenu')

/**
 * Controller to handle the side menu.
 *
 * @module mm.core.sidemenu
 * @ngdoc controller
 * @name mmSideMenuCtrl
 */
.controller('mmSideMenuCtrl', function($scope, $state, $mmSideMenuDelegate, $mmSitesManager, $mmSite, $mmEvents,
            $timeout, mmCoreEventLanguageChanged, mmCoreEventSiteUpdated, $mmSideMenu, mmCoreEventLogout, mmCoreConfigConstants, $mmMoxtra, $mmUtil) {

    $mmSideMenu.setScope($scope);
    $scope.handlers = $mmSideMenuDelegate.getNavHandlers();
    $scope.areNavHandlersLoaded = $mmSideMenuDelegate.areNavHandlersLoaded;
    $scope.siteinfo = $mmSite.getInfo();

    $scope.logout = function() {
        var chat;
        if (window.cordova)
            chat = window.cordova.require("cordova/plugin/MoxtraMeetIntegration");

        $mmSitesManager.logout().finally(function() {
        });
        
        if (window.cordova)
            chat.logout(function(){});
    };

    $scope.onStateHandler = function(state){
        // if (state == 'site.messages'){
        //     var currentUser = $mmSitesManager.getCurrentSite().infos;
        //     var modal = $mmUtil.showModalLoading('mm.core.loading', true);

        //     $mmMoxtra.authMoxtra(currentUser.userid, currentUser.firstname, currentUser.lastname)
        //     .then(function(response){
        //         $mmMoxtra.initMoxtra(response.data.access_token);
        //         $mmMoxtra.openChat();
        //     }, function(response){
        //         debugger;
        //     })
        //     .finally(function(){
        //         modal.dismiss();
        //     });
        // }else
            $state.go(state);
    }

    logoutObserver = $mmEvents.on(mmCoreEventLogout, function(data) {
        $mmSitesManager.deleteSite(data.siteId).finally(function() {
            $state.go('mm_login.credentials', {
                siteurl: mmCoreConfigConstants.siteurl,
                username: data.userName
            });
        });
    });

    $mmSite.getDocsUrl().then(function(docsurl) {
        $scope.docsurl = docsurl;
    });

    function updateSiteInfo() {
        // We need to use $timeout to force a $digest and make $watch notice the variable change.
        $scope.siteinfo = undefined;
        $timeout(function() {
            $scope.siteinfo = $mmSite.getInfo();

            // Update docs URL, maybe the Moodle release has changed.
            $mmSite.getDocsUrl().then(function(docsurl) {
                $scope.docsurl = docsurl;
            });
        });
    }

    var langObserver = $mmEvents.on(mmCoreEventLanguageChanged, updateSiteInfo);
    var updateSiteObserver = $mmEvents.on(mmCoreEventSiteUpdated, function(siteid) {
        if ($mmSite.getId() === siteid) {
            updateSiteInfo();
        }
    });

    $scope.$on('$destroy', function() {
        if (langObserver && langObserver.off) {
            langObserver.off();
        }
        if (updateSiteObserver && updateSiteObserver.off) {
            updateSiteObserver.off();
        }
        if (logoutObserver && logoutObserver.off){
            logoutObserver.off();
        }
    });
});
