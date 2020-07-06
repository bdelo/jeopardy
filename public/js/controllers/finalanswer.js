'use strict';

angular.module('myApp.controllers').
  controller('FinalAnswerCtrl', function ($scope, $modalInstance, response, socket) {
    angular.extend($scope, response);

    console.log($scope);
    console.log(response);
    
    // $scope.show =
    //   !response.id ? 'scores' :
    //     response.clue.daily_double ? 'daily' : 'clue';

    // socket.on('stump:confirm', function () {
    //   console.log('board got stump');
    // });

    // socket.on('clue:daily', function (data) {
    //   console.log('clue:daily ' + data);
    //   $scope.show = 'clue';
    // });
  });
