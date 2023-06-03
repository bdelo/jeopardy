"use strict";

angular
  .module("myApp.controllers")
  .controller(
    "GameClueCtrl",
    function ($scope, $modalInstance, response, socket) {
      $scope.category = response.category;
      $scope.clue = response.clue;
      $scope.game = response.game;
      $scope.parent_id = response.parent_id;
      $scope.result = {
        player_1: {},
        player_2: {},
        player_3: {},
        player_4: {},
        player_5: {},
        player_6: {},
        dd_player: response.game.control_player,
      };

      if (response.clue.daily_double) {
        var path = "/sounds/daily-double.mp3";
        var snd = new Audio(path);
        snd.play();
      }

      setTimeout(function () {
        $(".timer").removeClass("animated");
      }, 30);
      console.log("opened game clue");
      console.log($scope.clue);
      $(".timer").removeClass("animated");

      var value = response.id.split("_");
      $scope.result.value = $scope.result.dd_value =
        parseInt(value[3]) * (value[1] === "J" ? 200 : 400);

      $scope.setResult = function (num, correct) {
        if ($scope.game.round == "FJ") {
          var finalScore = 0;
          if (num == 1) {
            $scope.game.player_1.final_score = correct
              ? $scope.game.player_1.score + $scope.game.player_1.fj_wager
              : $scope.game.player_1.score - $scope.game.player_1.fj_wager;
            finalScore = $scope.game.player_1.final_score;
          } else if (num == 2) {
            $scope.game.player_2.final_score = correct
              ? $scope.game.player_2.score + $scope.game.player_2.fj_wager
              : $scope.game.player_2.score - $scope.game.player_2.fj_wager;
            finalScore = $scope.game.player_2.final_score;
          } else if (num == 3) {
            $scope.game.player_3.final_score = correct
              ? $scope.game.player_3.score + $scope.game.player_3.fj_wager
              : $scope.game.player_3.score - $scope.game.player_3.fj_wager;
            finalScore = $scope.game.player_3.final_score;
          } else if (num == 4) {
            $scope.game.player_4.final_score = correct
              ? $scope.game.player_4.score + $scope.game.player_4.fj_wager
              : $scope.game.player_4.score - $scope.game.player_4.fj_wager;
            finalScore = $scope.game.player_4.final_score;
          } else if (num == 5) {
            $scope.game.player_5.final_score = correct
              ? $scope.game.player_5.score + $scope.game.player_5.fj_wager
              : $scope.game.player_5.score - $scope.game.player_5.fj_wager;
            finalScore = $scope.game.player_5.final_score;
          } else if (num == 6) {
            $scope.game.player_6.final_score = correct
              ? $scope.game.player_6.score + $scope.game.player_6.fj_wager
              : $scope.game.player_6.score - $scope.game.player_6.fj_wager;
            finalScore = $scope.game.player_6.final_scores;
          }

          socket.emit("fj:reveal-wager", "player_" + num, finalScore);
        }

        var key = "player_" + num;
        $scope.result[key][correct ? "right" : "wrong"] = !$scope.result[key][
          correct ? "right" : "wrong"
        ];
        $scope.result[key][correct ? "wrong" : "right"] = undefined;

        if ($scope.result[key].right && response.id !== "clue_FJ") {
          if (num === 1) {
            $scope.result.player_2.right = undefined;
            $scope.result.player_3.right = undefined;
            $scope.result.player_4.right = undefined;
            $scope.result.player_5.right = undefined;
            $scope.result.player_6.right = undefined;
          } else if (num === 2 && response.id !== "clue_FJ") {
            $scope.result.player_1.right = undefined;
            $scope.result.player_3.right = undefined;
            $scope.result.player_4.right = undefined;
            $scope.result.player_5.right = undefined;
            $scope.result.player_6.right = undefined;
          } else if (num === 3 && response.id !== "clue_FJ") {
            $scope.result.player_1.right = undefined;
            $scope.result.player_2.right = undefined;
            $scope.result.player_4.right = undefined;
            $scope.result.player_5.right = undefined;
            $scope.result.player_6.right = undefined;
          } else if (num === 4 && response.id !== "clue_FJ") {
            $scope.result.player_1.right = undefined;
            $scope.result.player_2.right = undefined;
            $scope.result.player_3.right = undefined;
            $scope.result.player_5.right = undefined;
            $scope.result.player_6.right = undefined;
          } else if (num === 5 && response.id !== "clue_FJ") {
            $scope.result.player_1.right = undefined;
            $scope.result.player_2.right = undefined;
            $scope.result.player_4.right = undefined;
            $scope.result.player_3.right = undefined;
            $scope.result.player_6.right = undefined;
          } else if (num === 6 && response.id !== "clue_FJ") {
            $scope.result.player_1.right = undefined;
            $scope.result.player_2.right = undefined;
            $scope.result.player_4.right = undefined;
            $scope.result.player_3.right = undefined;
            $scope.result.player_5.right = undefined;
          }
        }
      };

      $scope.setDDValue = function () {
        $scope.result.value = parseInt($scope.result.dd_value);
        $scope.result.dd_confirm = true;
        console.log("clue:daily emit");
        socket.emit("clue:daily", response.id);
      };

      $scope.setDDResult = function (correct) {
        console.log("setDDResult " + correct);
        $scope.result.dd_result = correct;
      };

      $scope.resetBuzzer = function () {
        socket.emit("buzz:reset", $scope.parent_id);
        $("#buzzed-player").html("");
        $(".timer").removeClass("animated");
      };

      $scope.stump = function () {
        socket.emit("stump:send");
      };

      socket.on("buzz:success", function (name) {
        $("#buzzed-player").html(name);
        $(".timer").addClass("animated");
      });

      $scope.playTimeout = function () {
        socket.emit("buzz:lock", $scope.parent_id);
        var path = "/sounds/times-up.mp3";
        var snd = new Audio(path);
        snd.play();
      };

      $scope.playFinalMusic = function () {
        var path = "/sounds/jeopardy-think.mp3";
        var snd = new Audio(path);
        snd.play();
      };

      $scope.revealFinal = function (playerId) {
        var playerId = "player_" + playerId;
        var playerInfo = $scope.game[playerId];
        console.log("revealing final for " + playerId);
        socket.emit("fj:reveal", playerId, playerInfo);
      };

      $scope.ok = function () {
        var result = {};
        if ($scope.clue.daily_double) {
          $scope.result[$scope.result.dd_player] =
            $scope.result[$scope.result.dd_player] || {};
          $scope.result[$scope.result.dd_player][
            $scope.result.dd_result ? "right" : "wrong"
          ] = true;
        }
        result[response.id] = $scope.result;
        $modalInstance.close(result);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
      };
    }
  );
