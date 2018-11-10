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

    $scope.colors = [
        '#CCCCCC',
        '#007BFF',
        '#FF4000',
        '#28a745',
        '#FFFF00',
        '#00FFFF',
        '#800080',
        '#008080',
        '#FF00FF',
        '#FFA500',
    ];

    $scope.isEditMode = false;

    $scope.videos = [];
    $scope.currentVideo = {duration: -1};
    $scope.currentStatus = '0';
    $scope.currentActionsMap = new Map();
    $scope.currentActionsCache = [];


    vid.addEventListener('loadedmetadata', function () {
        if ($scope.currentVideo.duration < 0) {
            $scope.currentStatus = '0';
            $scope.currentVideo.duration = Math.round(vid.duration * 10) / 10;
            $scope.currentActionsMap = initializeActions(vid.duration);
            $scope.$apply();
            console.log($scope.currentVideo.duration);
        }
    });


    $http.get("/api/videos").then(function (response) {
        $scope.videos = response.data;
    });


    $interval(function () {
        if (vid.readyState === 4 && vid.paused === false) {
            let frame_id = Math.round(vid.currentTime * 10);
            if ($scope.isEditMode) {
                let value_old = $scope.currentActionsMap.get(frame_id)
                let value_new = parseInt($scope.currentStatus)

                if (value_old !== value_new) {
                    $scope.currentActionsMap.set(frame_id, value_new);
                    $scope.currentActionsCache = compressToCache($scope.currentActionsMap, $scope.currentVideo.duration);
                }
            } else {
                $scope.currentStatus = $scope.currentActionsMap.get(frame_id).toString();
            }
        }
    }, 25);

    $scope.onSave = function () {
        $scope.currentVideo.actions = compressActions($scope.currentActionsMap, $scope.currentVideo.duration);
        console.log($scope.currentVideo);

        videosFactory.update($scope.currentVideo);
    };

    $scope.onActionSelect = function () {
        $scope.isEditMode = true;
        $('#checkboxEditMode').addClass('active')
    };

    $scope.onVideoClick = function (video) {
        $scope.currentStatus = '0';
        $scope.currentActionsMap = new Map();

        if (video.duration === undefined) {
            video.duration = -1
        }

        $scope.currentVideo = video;


        if ($scope.currentVideo.actions != null && video.duration > 0) {
            $scope.currentActionsMap = extractActions(video.actions, video.duration);
            $scope.currentActionsCache = compressToCache($scope.currentActionsMap, $scope.currentVideo.duration);

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

    function compressToCache(actionsMap, duration) {
        let actionsList = [];
        let length = Math.ceil(duration * 10);
        let lastIndex = 0;
        let lastAction = -1;
        for (let i = 0; i <= length; i++) {
            let action = 0;
            if (actionsMap.has(i)) {
                action = actionsMap.get(i)
            }
            if (action !== lastAction) {
                if (lastAction !== -1) {
                    actionsList.push([lastAction, (i - lastIndex) / duration / 10]);
                }

                lastAction = action;
                lastIndex = i;
            }
        }

        if (lastAction !== -1) {
            actionsList.push([lastAction, (duration * 10 - lastIndex) / duration / 10]);
        }

        return actionsList;
    }

    function initializeActions(duration) {
        let actionsMap = new Map();
        let length = Math.ceil(duration * 10);
        for (let i = 0; i <= length; i++) {
            actionsMap.set(i, 0)
        }
        return actionsMap;
    }

}]);
