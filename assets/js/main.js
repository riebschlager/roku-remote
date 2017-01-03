require('angular');

let app = angular.module('RokuApp', []);

app.config(function($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/);
});

app.controller('RokuController', function($scope, $http) {

    $scope.isSearching = true;
    $scope.deviceProperties = [];

    let host;
    let x2js = new X2JS();
    let Client = require('node-ssdp').Client;
    let client = new Client();

    client.on('response', function(headers, statusCode, rinfo) {

        $scope.$apply(function() {
            host = headers.LOCATION;
            $http.get(host + 'query/device-info').then(function(res) {
                let json = x2js.xml_str2json(res.data);
                $scope.device = json['device-info'];
                angular.forEach(json['device-info'], function(value, key) {
                    value = value || 'null';
                    $scope.deviceProperties.push(key + ' : ' + value);
                });
            });
            $scope.isSearching = false;
            $http.get(host + 'query/apps').then(function(res) {
                let json = x2js.xml_str2json(res.data);
                $scope.apps = json.apps.app;
                $scope.apps.forEach(function(app) {
                    $http.get(host + 'query/icon/' + app._id, {
                        responseType: 'arraybuffer'
                    }).then(function(res) {
                        var reader = new FileReader();
                        reader.readAsDataURL(new Blob([res.data]));
                        reader.onloadend = function(e) {
                            $scope.$apply(function() {
                                app.icon = e.target.result;
                            });
                        };
                    });
                });
            });
        });
    });

    client.search('roku:ecp');

    $scope.openApp = function(appId) {
        $http.post(host + 'launch/' + appId);
    };

    $scope.keypress = function(btn) {
        $http.post(host + 'keypress/' + btn);
    };

    $scope.keydown = function(btn) {
        $http.post(host + 'keydown/' + btn);
    };

    $scope.keyup = function(btn) {
        $http.post(host + 'keyup/' + btn);
    };
});
