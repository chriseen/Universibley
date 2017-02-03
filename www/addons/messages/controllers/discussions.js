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

angular.module('mm.addons.messages')

/**
 * Discussions controller.
 *
 * @module mm.addons.messages
 * @ngdoc controller
 * @name mmaMessagesDiscussionsCtrl
 */
.controller('mmaMessagesDiscussionsCtrl', function($scope, $ionicActionSheet, $cordovaClipboard, $cordovaDialogs, $mmUtil, $mmaMessages, $rootScope, $mmEvents, $mmSite, $mmSitesManager,
            mmCoreSplitViewLoad, mmaMessagesNewMessageEvent, mmaMoxtraClientID, mmaMoxtraClientSecret) {
    var newMessagesObserver,
        siteId = $mmSite.getId(),
        discussions;

    $scope.loaded = false;
    $scope.modal = null;

    function fetchDiscussions() {
        return $mmaMessages.getDiscussions().then(function(discs) {
            discussions = discs;
            // Convert to an array for sorting.
            var array = [];
            angular.forEach(discussions, function(v) {
                array.push(v);
            });
            $scope.discussions = array;
        }, function(error) {
            if (typeof error === 'string') {
                $mmUtil.showErrorModal(error);
            } else {
                $mmUtil.showErrorModal('mma.messages.errorwhileretrievingdiscussions', true);
            }
        });
    }

    function refreshData() {
        return $mmaMessages.invalidateDiscussionsCache().then(function() {
            return fetchDiscussions();
        });
    }

    $scope.onDiscussion = function(disc){

        var userId = disc.message.user;
        var currentUser = $mmSitesManager.getCurrentSite().infos;
        var chat = window.cordova.require("cordova/plugin/MoxtraMeetIntegration");

        // moxtraplugin1.0.4@1.4.0  -  the latest version of android Moxtra Meet plugin that Jay provided

        chat.setInviteButtonHidden(false);//default is false.
        chat.setSupportAutoJoinAudio(true);//default is true.
        chat.setSupportAutoStartScreenShare(true);//default is true.
        chat.setSupportInviteContactsBySMS(true);
        chat.setSupportInviteContactsByEmail(true);
        //customize email title & contents.
        chat.setSubjectOfEmailContentTitle('This is email title');

        //cutomize features
        chat.setAutoHideControlBar(false);//default is false.
        chat.setSupportVoIP(true);//default is true.
        chat.setSupportChat(true);//default is true.

        // startChat() needs to accept at least 2 parameters: one for chatRoomName, and one for the individual peer ID for my friend 
        // it should return binderID as a successful response

        // Get Binder List
        // https://developer.moxtra.com/docs/docs-rest-api/conversation/
        
        $scope.modal = $mmUtil.showModalLoading();

        chat.initUser(
            function(){

                $ionicActionSheet.show({
                    buttons: [
                        { text: 'Create Chat' },
                        { text: 'Join Chat' }
                    ],
                    titleText: 'Select your choice',
                    cancelText: 'Cancel',
                    cancel: function(){
                        $scope.modal.dismiss();
                    },
                    buttonClicked: function(index) {
                        if (index){
                            $cordovaDialogs.prompt("Enter your contact's binderID.")
                            .then(function(result) {
                                var binderID = result.input1;
                                var btnIndex = result.buttonIndex;

                                if ((btnIndex == 1) && (binderID.trim().length > 0)){
                                    console.log("BINDER ID: " + binderID);
                                    chat.openChat(binderID + "");
                                }

                                $scope.modal.dismiss();
                            });
                        }else{
                            $scope.startChat(chat, userId);
                        }

                        return true;
                    }
                });
            },
            function(){
                $scope.modal.dismiss();
            },
            currentUser.firstname,
            currentUser.lastname,
            currentUser.userid + "",
            null,
            mmaMoxtraClientID,
            mmaMoxtraClientSecret
        );
    };

    $scope.startChat = function(chat, userId){

        chat.startChat(function(binderID){
            $cordovaClipboard.copy(binderID);

            $cordovaDialogs.alert("New Binder ID - " + binderID + " - is now copied to your clipboard automatically!")
            .then(function() {
                console.log("BINDER ID: " + binderID);
                chat.openChat(binderID + "");
                $scope.modal.dismiss();
            });
        },
        function(errorID){
            $scope.modal.dismiss();
        },
        "New Binder",
        userId + "");
    };

    $scope.refresh = function() {
        refreshData().finally(function() {
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    fetchDiscussions().finally(function() {
        $scope.loaded = true;
        // Tell mm-split-view that it can load the first link now in tablets. We need to do it
        // like this because the directive doesn't have access to $scope.loaded variable (because of tabs).
        $rootScope.$broadcast(mmCoreSplitViewLoad);
    });

    newMessagesObserver = $mmEvents.on(mmaMessagesNewMessageEvent, function(data) {
        var discussion;

        if (data && data.siteid == siteId && data.userid) {
            discussion = discussions[data.userid];

            if (typeof discussion == 'undefined') {
                // It's a new discussion. Refresh list.
                $scope.loaded = false;
                refreshData().finally(function() {
                    $scope.loaded = true;
                });
            } else {
                // An existing discussion has a new message, update the last message.
                discussion.message.message = data.message;
                discussion.message.timecreated = data.timecreated;
            }
        }
    });

    $scope.$on('$destroy', function() {
        if (newMessagesObserver && newMessagesObserver.off) {
            newMessagesObserver.off();
        }
    });
});

