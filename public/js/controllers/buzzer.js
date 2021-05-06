"use strict";

angular
  .module("myApp.controllers")
  .controller("BuzzerCtrl", function ($scope, socket) {
    socket.emit("buzzer:init");

    socket.on("buzzer:init", function (data) {
      console.log("buzzer init");
      if (data) {
        $scope.data = data.data;
        $scope.game = data.game;
      }
    });

    $scope.submitName = function () {
      $("#buzzer-name-input").hide();
      $("#buzzer-name").show();
      $("#buzzer-button").show();
    };

    function resetTimer() {
      $(".timer").removeClass("animated");
    }

    function startTimer() {
      $(".timer").addClass("animated");
    }

    socket.on("clue:start", function (_) {
      resetTimer();
      $("#buzzer-button").prop("disabled", false);
    });

    socket.on("buzz:fail", function (playerName) {
      if ($("#buzzer-name").html() == playerName) {
        lockBuzzer();
      }
    });

    function lockBuzzer() {
      $("#buzzer-lock-warning").html("Buzzer Disabled!");
      $("#buzzer-button").prop("disabled", true);

      setTimeout(function () {
        $("#buzzer-lock-warning").html(" ");
        $("#buzzer-button").prop("disabled", false);
      }, 400);
    }

    socket.on("buzz:success", function (buzzedName) {
      var buzzerButton = $("#buzzer-button");
      //buzzerButton.prop('disabled', true);

      if ($("#buzzer-name").html() == buzzedName) {
        buzzerButton.css("background-color", "green");
        buzzerButton.html("Buzzed!");
        startTimer();
      } else {
        buzzerButton.css("background-color", "#c40d0a");
        buzzerButton.html("Locked");
      }
    });

    socket.on("final:start", function () {
      $(".final-jeopardy").show();
      $("#buzzer-button").hide();
    });

    socket.on("buzz:reset:success", function (previousBuzzers) {
      var buzzerButton = $("#buzzer-button");
      $("#buzzer-name").html();
      if (previousBuzzers.includes($("#buzzer-name").html())) {
        buzzerButton.css("background-color", "#c40d0a");
        buzzerButton.html("Already Buzzed");
        buzzerButton.prop("disabled", true);
      } else {
        buzzerButton.css("background-color", "#0015a0");
        buzzerButton.html("Buzz");
        //buzzerButton.prop('disabled', false);
      }
    });

    $scope.buzz = function (name) {
      socket.emit("buzz:attempt", {
        id: $scope.data.id,
        name: name,
      });
    };

    $scope.submitWager = function (name, wager) {
      console.log("wager submitted");
      socket.emit("final_wager:submit", {
        id: $scope.data.id,
        wager: {
          name: name,
          wager_amount: wager,
        },
      });
    };

    $scope.submitFinal = function (name, wager, answer) {
      socket.emit("final:submit", {
        id: $scope.data.id,
        answer: {
          name: name,
          wager: wager,
          answer: answer,
        },
      });
    };
  });
