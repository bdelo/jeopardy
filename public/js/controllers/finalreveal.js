"use strict";

angular
  .module("myApp.controllers")
  .controller(
    "FinalRevealCtrl",
    function ($scope, $modalInstance, response, socket) {
      angular.extend($scope, response);

      $scope.wagerRevealed = null;
      $scope.finalAmount = null;

      socket.on("fj:reveal-wager", function (playerId, finalScore) {
        if (playerId == $scope.playerId) {
          $scope.wagerAmount = "$"+$scope.playerInfo.fj_wager;
          $scope.finalAmount = "$"+finalScore;
        }
      });
    }
  );
