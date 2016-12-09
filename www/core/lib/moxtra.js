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

angular.module('mm.core')

.constant('mmCoreMoxtraAPI', 'https://apisandbox.moxtra.com/oauth/token')
.constant('mmCoreMoxtraClientID', 'tOXWlNAfcxE')
.constant('mmCoreMoxtraClientSecret', 'goFmrHgg7ms')
.constant('mmCoreMoxtraGrantType', 'http://www.moxtra.com/auth_uniqueid')

/**
 * Sites manager service.
 *
 * @module mm.core
 * @ngdoc service
 * @name $mmSitesManager
 */
.factory('$mmMoxtra', function($http, $mmUtil, mmCoreMoxtraAPI, mmCoreMoxtraClientID, mmCoreMoxtraClientSecret, mmCoreMoxtraGrantType) {

    var self = {},
        accessToken = null;

    self.authMoxtra = function(id, firstName, lastName){

        var param = new FormData();
        param.append("client_id", mmCoreMoxtraClientID);
        param.append("client_secret", mmCoreMoxtraClientSecret);
        param.append("grant_type", mmCoreMoxtraGrantType);
        param.append("uniqueid", id);
        param.append("timestamp", new Date().getTime());
        param.append("firstname", firstName);
        param.append("lastname", lastName);

        var config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        var param = {
            "client_id": mmCoreMoxtraClientID,
            "client_secret": mmCoreMoxtraClientSecret,
            "grant_type": mmCoreMoxtraGrantType,
            "uniqueid": id,
            "timestamp": new Date().getTime(),
            "firstname": firstName,
            "lastname": lastName
        }

        return $http.post(
            mmCoreMoxtraAPI,
            param,
            config
        )
    }

    self.initMoxtra = function(access_token){

        accessToken = access_token;

        var options = {
            mode: "sandbox", //for production environment change to "production"
            client_id: mmCoreMoxtraClientID,
            access_token: access_token, //valid access token from user authentication
            invalid_token: function(event) {
                $mmUtil.showErrorModal("Access Token expired for session id: " + event.session_id);
            }
        };

        Moxtra.init(options);
    }


    self.openChat = function(){

        var options = {
            unique_id: "2",
            iframe: false,
            autostart_meet: true,
            autostart_note: false,
            start_chat: function(event) {
                alert("Chat started session Id: " + event.session_id);
            },
            invite_meet: function(event) {
                alert("Meet invite");
            },
            start_meet: function(event) {
                alert("Meet started session key: " + event.session_key + " session id: " + event.session_id);
            },
            end_meet: function(event) {
                alert("Meet end event");
            },
            invite_member: function(event) {
                alert("Invite member into binder Id: " + event.binder_id);
            },
            request_note: function(event) {
                alert("Clip start request");
            },
            error: function(event) {
                alert("Chat error code: " + event.error_code + " error message: " + event.error_message);
            }
        };

        Moxtra.chat(options);
    }

    self.reset = function(){
        accessToken = null;
    }

    return self;

});
