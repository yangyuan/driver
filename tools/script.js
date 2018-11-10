const app = angular.module('driverApp', ['ngResource']);


app.factory('videosFactory', ['$resource', function ($resource) {
    return $resource('/api/videos/:videoId', {category: '@category', videoId: '@name'}, {
        'get': {method: 'GET'},
        'update': {method: 'PUT'},
        'query': {method: 'GET', isArray: true},
        'delete': {method: 'DELETE'}
    });
}]);


app.controller('VideosController', ['$scope', '$http', '$interval', 'videosFactory', function ($scope, $http, $interval, videosFactory) {
    let vid = document.getElementById("player");
    $scope.isEditMode = false;

    $scope.videos = [];
    $scope.currentVideo = {};
    $scope.currentStatus = '0';
    $scope.currentDuration = -1;
    $scope.currentActionsMap = new Map();

    vid.addEventListener('loadedmetadata', function () {
        if ($scope.currentDuration < 0) {
            $scope.currentStatus = '0';
            $scope.currentDuration = vid.duration;
            $scope.currentActionsMap = initializeActions($scope.currentDuration);
            $scope.$apply();
            console.log($scope.currentDuration);
        }
    });


    $http.get("/api/videos").then(function (response) {
        $scope.videos = response.data;
    });


    $interval(function () {
        if (vid.readyState === 4 && vid.paused === false) {
            let frame_id = Math.round(vid.currentTime * 10);
            if ($scope.isEditMode) {
                // console.log(vid.currentTime);
                // console.log(parseInt($scope.currentStatus));
                $scope.currentActionsMap.set(frame_id, parseInt($scope.currentStatus));
            } else {
                $scope.currentStatus = $scope.currentActionsMap.get(frame_id).toString();
            }
        }
    }, 25);

    $scope.onSave = function () {
        $scope.currentVideo.actions = compressActions($scope.currentActionsMap, $scope.currentDuration);
        console.log($scope.currentVideo);

        videosFactory.update($scope.currentVideo);
    };

    $scope.onVideoClick = function (video) {
        $scope.currentVideo = {};
        $scope.currentStatus = '0';
        $scope.currentDuration = -1;
        $scope.currentActionsMap = new Map();

        $scope.currentVideo = video;
        if ($scope.currentVideo.actions != null && video.duration > 0) {
            $scope.currentDuration = video.duration;
            $scope.currentActionsMap = extractActions(video.actions, video.duration);

            if ($scope.currentActionsMap.has(0)) {
                $scope.currentStatus = $scope.currentActionsMap.get(0).toString();
            }
        }

        vid.src = "/data/" + $scope.currentVideo.name;
    };

    function extractActions(actionsList, duration) {
        let actionsMap = new Map();
        let compressedActionsMap = new Map();
        let length = Math.ceil(duration * 10);
        let lastAction = -1;

        for (let i = 0; i < actionsList.length; i++) {
            let frame_id = Math.floor(actionsList[i][0] * 10);
            let frame_action = Math.floor(actionsList[i][1]);
            compressedActionsMap.set(frame_id, frame_action)
        }

        for (let i = 0; i <= length; i++) {
            let seek = i / 10;
            let action = 0;
            if (compressedActionsMap.has(i)) {
                lastAction = compressedActionsMap.get(i);
            }
            actionsMap.set(i, lastAction);
        }

        return actionsMap
    }

    function compressActions(actionsMap, duration) {
        let actionsList = [];
        let length = Math.ceil(duration * 10);
        let lastAction = -1;
        for (let i = 0; i <= length; i++) {
            let seek = i / 10;
            let action = 0;
            if (actionsMap.has(i)) {
                action = actionsMap.get(i)
            }
            if (action !== lastAction) {
                actionsList.push([seek, action]);
                lastAction = action
            }
        }
        return actionsList;
    }

    function initializeActions(duration) {
        let actionsMap = new Map();
        let length = Math.ceil(duration * 10);
        for (let i = 0; i <= length; i++) {
            actionsMap.set(i, -1)
        }
        return actionsMap;
    }

}]);
