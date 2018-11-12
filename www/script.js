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
        '#999999',
        '#32CD32',
        '#800080',
        '#008080',
        '#FF0099',
        '#7FFFD4',
        '#FF6600',
        '#339999',
        '#FF3300',
        '#0077FF',
    ];

    $scope.isEditMode = false;
    $scope.isEditDepatureMode = false;

    $scope.videos = [];
    $scope.currentVideo = {duration: -1};
    $scope.currentStatus = '0';
    $scope.currentDepature = '0';
    $scope.currentActionsMap = new Map();
    $scope.currentDepatureMap = new Map();
    $scope.currentActionsCache = [];
    $scope.currentDepatureCache = [];

    $scope.refreshVideos = function () {
        let videos = videosFactory.query();
    };

    $scope.videos = videosFactory.query();

    vid.addEventListener('loadedmetadata', function () {
        if ($scope.currentVideo.duration < 0) {
            $scope.currentStatus = '0';
            $scope.currentVideo.duration = Math.round(vid.duration * 10) / 10;
            $scope.currentActionsMap = initializeActions(vid.duration);
            $scope.currentDepatureMap = initializeDepartures(vid.duration);
            $scope.$apply();
            console.log($scope.currentVideo.duration);
        }
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

            if ($scope.isEditDepatureMode) {
                let value_old = $scope.currentDepatureMap.get(frame_id)
                let value_new = parseInt($scope.currentDepature)

                if (value_old !== value_new) {
                    $scope.currentDepatureMap.set(frame_id, value_new);
                    $scope.currentDepatureCache = compressToCache($scope.currentDepatureMap, $scope.currentVideo.duration);
                }
            } else {
                $scope.currentDepature = $scope.currentDepatureMap.get(frame_id).toString();
            }
        }
    }, 25);

    $scope.onSave = function () {
        $scope.currentVideo.actions = compressActions($scope.currentActionsMap, $scope.currentVideo.duration);
        $scope.currentVideo.warnings = compressActions($scope.currentDepatureMap, $scope.currentVideo.duration);
        $scope.currentVideo.status = 1;
        console.log($scope.currentVideo);

        videosFactory.update($scope.currentVideo);
    };

    $scope.onActionSelect = function ($event) {
        $scope.isEditMode = true;
        $('#checkboxEditMode').addClass('active');

        $event.currentTarget.addClass('active').siblings().removeClass('active');
        $event.currentTarget.addClass('focus').siblings().removeClass('focus');
    };

    $scope.onVideoClick = function (video) {
        $scope.currentStatus = '0';
        $scope.currentActionsMap = new Map();
        $scope.currentDepature = '0';
        $scope.currentDepatureMap = new Map();

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
        } else {
            $scope.currentActionsCache = [];
        }

        if ($scope.currentVideo.warnings != null && video.duration > 0) {
            $scope.currentDepatureMap = extractActions(video.warnings, video.duration);
            $scope.currentDepatureCache = compressToCache($scope.currentDepatureMap, $scope.currentVideo.duration);

            if ($scope.currentDepatureMap.has(0)) {
                $scope.currentDepature = $scope.currentDepatureMap.get(0).toString();
            }
        } else {
            $scope.currentDepatureCache = [];
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

    function initializeDepartures(duration) {
        let actionsMap = new Map();
        let length = Math.ceil(duration * 10);
        for (let i = 0; i <= length; i++) {
            actionsMap.set(i, 0)
        }
        return actionsMap;
    }

}]);
