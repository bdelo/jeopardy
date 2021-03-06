"use strict";

angular
  .module("myApp.controllers")
  .controller("GameCtrl", function ($scope, $modal, response, socket) {
    $scope.data = response.data;
    $scope.hideComments = {};
    $scope.final_answers = [];
    $scope.final_wagers = [];

    socket.emit("game:init", $scope.data.id);

    socket.on("game:init", function (data) {
      console.log("game:init " + !!data);
      if (data) {
        $scope.game = data.game;
      }
    });

    socket.on("round:start", function (data) {
      console.log("round:start");
      $scope.game = data.game;
      if (data.game.round == "J" || data.game.round == "DJ") {
        var sound = new Audio("/sounds/jeopardy-board-fill.mp3");
        sound.play();
      }
    });

    $scope.startGame = function () {
      console.log("game:start emit");
      socket.emit(
        "game:start",
        {
          data: $scope.data,
          game: $scope.game,
        },
        function (result) {
          console.log("callback");
        }
      );
    };

    $scope.editScores = function () {
      console.log("editing scores");
      var editScoreModal = $modal.open({
        templateUrl: "partials/editscores",
        backdrop: "static",
        size: "lg",
        openedClass: "edit-scores-modal-open",
        scope: $scope,
        resolve: {
          items: function () {
            return {
              id: "edit-scores-modal",
              game: $scope.game,
            };
          },
        },
      });

      $scope.done = function () {
        editScoreModal.dismiss("cancel");
      };
    };

    $scope.startClue = function (id) {
      console.log("clue:start emit " + id);
      socket.emit("buzz:lock", $scope.data.id);
      socket.emit("clue:start", id);
      var modalInstance = $modal.open({
        templateUrl: "partials/gameclue",
        controller: "GameClueCtrl",
        backdrop: "static",
        keyboard: false,
        size: "lg",
        openedClass: "game-modal-open",
        resolve: {
          response: function () {
            var split = id.split("_").slice(0, 3);
            split[0] = "category";

            if (split.length === 2) {
              split.push(1);
            }

            return {
              id: id,
              category: $scope.data[split.join("_")],
              clue: $scope.data[id],
              game: $scope.game,
              parent_id: $scope.data.id,
            };
          },
        },
      });

      modalInstance.result.then(function (result) {
        angular.extend($scope.game, result);

        // Keep score.
        result = result[id];
        [1, 2, 3, 4, 5, 6].forEach(function (num) {
          var key = "player_" + num;
          $scope.game[key] = $scope.game[key] || {};
          $scope.game[key].score = $scope.game[key].score || 0;

          var value =
            id === "clue_FJ"
              ? parseInt($scope.game[key].fj_wager)
              : result.value;

          if (result[key] && result[key].right) {
            $scope.game[key].score += value;
            $scope.game.control_player = key;
          } else if (result[key] && result[key].wrong) {
            $scope.game[key].score -= value;
          }
        });

        console.log("clue:end emit");
        socket.emit("clue:end", $scope.game);
      });
    };

    $scope.endRound = function () {
      console.log("round:end emit");
      socket.emit("round:end", $scope.game);
    };

    $scope.submitFinal = function () {
      console.log("submit final");
    };

    $scope.toggleComments = function (category) {
      $scope.hideComments[category] = !$scope.hideComments[category];
    };

    $scope.resetGame = function () {
      socket.emit("game:reset", $scope.data.id);
      $scope.game = {
        control_player: "player_1",
        final_wagers: [],
        final_answers: [],
      };
    };
    $scope.resetGame();
  });
