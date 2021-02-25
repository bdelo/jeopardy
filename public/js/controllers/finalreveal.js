"use strict";

angular
  .module("myApp.controllers")
  .controller(
    "FinalRevealCtrl",
    function ($scope, $modalInstance, response, socket) {
      angular.extend($scope, response);

      $scope.wagerRevealed = "";
      $scope.finalAmount = formatMoney($scope.playerInfo.score);

      socket.on("fj:reveal-wager", function (playerId, finalScore) {
        if (playerId == $scope.playerId) {
          $scope.wagerAmount = formatMoney($scope.playerInfo.fj_wager);
          $scope.finalAmount = formatMoney(finalScore);
        }
      });

      function formatMoney(number) {
        return number.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      }
    }
  );
