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
    $scope.currentVideo = {duration: -1};
    $scope.currentStatus = 0;
    $scope.currentStatusDenseMap = new Map();
    $scope.currentStatusDenseList = [];

    $scope.videos = videosFactory.query();

    $scope.getColor = function (scale) {
        return ["rgb(",scale*255,",",255-Math.abs(0.5-scale)*510,",",(1-scale)*255,")"].join("");
    }

    vid.addEventListener('loadedmetadata', function () {
        if ($scope.currentVideo.duration < 0) {
            $scope.currentStatus = 0;
            $scope.currentVideo.duration = Math.round(vid.duration * 10) / 10;
            $scope.currentStatusDenseMap = StatusHelper.initialize(vid.duration);
            $scope.$apply();
            console.log($scope.currentVideo.duration);
        }
    });

    $interval(function () {
        if (vid.readyState === 4 && vid.paused === false) {
            let frame_id = Math.round(vid.currentTime * 10);
            if ($scope.isEditMode) {
                let value_old = $scope.currentStatusDenseMap.get(frame_id);
                let value_new = parseInt($scope.currentStatus);

                if (value_old !== value_new) {
                    $scope.currentStatusDenseMap.set(frame_id, value_new);
                    $scope.currentStatusDenseList = StatusHelper.toDenseList($scope.currentStatusDenseMap, $scope.currentVideo.duration);
                }
            } else {
                $scope.currentStatus = $scope.currentStatusDenseMap.get(frame_id).toString();
            }
        }
    }, 25);

    $scope.onSave = function () {
        $scope.currentVideo.speeds = StatusHelper.toSparseList($scope.currentStatusDenseMap, $scope.currentVideo.duration);
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
        $scope.currentStatus = 0;
        $scope.currentStatusDenseMap = new Map();

        if (video.duration === undefined) {
            video.duration = -1
        }

        $scope.currentVideo = video;


        if ($scope.currentVideo.speeds != null && video.duration > 0) {
            $scope.currentStatusDenseMap = StatusHelper.toDenseMap(video.speeds, video.duration);
            $scope.currentStatusDenseList = StatusHelper.toDenseList($scope.currentStatusDenseMap, $scope.currentVideo.duration);

            if ($scope.currentStatusDenseMap.has(0)) {
                $scope.currentStatus = $scope.currentStatusDenseMap.get(0).toString();
            }
        } else {
            $scope.currentStatusDenseList = [];
        }

        vid.src = "/data/" + $scope.currentVideo.name;
    };

}]);


class StatusHelper {

    static initialize (duration) {
        let statusMap = new Map();
        let length = Math.ceil(duration * 10);
        for (let i = 0; i <= length; i++) {
            statusMap.set(i, 0)
        }
        return statusMap;
    }

    static toDenseList(denseMap, duration) {
        let denseList = [];
        let length = Math.ceil(duration * 10);
        let lastIndex = 0;
        let lastStatus = -1;
        for (let i = 0; i <= length; i++) {
            let status = 0;
            if (denseMap.has(i)) {
                status = denseMap.get(i)
            }
            if (status !== lastStatus) {
                if (lastStatus !== -1) {
                    denseList.push([lastStatus, (i - lastIndex) / duration / 10]);
                }

                lastStatus = status;
                lastIndex = i;
            }
        }

        if (lastStatus !== -1) {
            denseList.push([lastStatus, (duration * 10 - lastIndex) / duration / 10]);
        }

        return denseList;
    }

    static toSparseList(denseMap, duration) {
        let sparseList = [];
        let length = Math.ceil(duration * 10);
        let lastStatus = -1;
        for (let i = 0; i <= length; i++) {
            let seek = i / 10;
            let action = 0;
            if (denseMap.has(i)) {
                action = denseMap.get(i)
            }
            if (action !== lastStatus) {
                sparseList.push([seek, action]);
                lastStatus = action
            }
        }
        return sparseList;
    }

    static toDenseMap(sparseList, duration) {
        let statusMap = new Map();
        let compressedActionsMap = new Map();
        let length = Math.ceil(duration * 10);
        let lastAction = -1;

        for (let i = 0; i < sparseList.length; i++) {
            let frame_id = Math.floor(sparseList[i][0] * 10);
            let frame_action = Math.floor(sparseList[i][1]);
            compressedActionsMap.set(frame_id, frame_action)
        }

        for (let i = 0; i <= length; i++) {
            if (compressedActionsMap.has(i)) {
                lastAction = compressedActionsMap.get(i);
            }
            statusMap.set(i, lastAction);
        }

        return statusMap
    }
}