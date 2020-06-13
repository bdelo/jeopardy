'use strict';

angular.module('myApp.controllers').
  controller('BuzzerCtrl', function ($scope, $modal, response, socket) {
    $scope.data = response.data;
    console.log($scope.data)

    socket.emit('game:init', $scope.data.id);
    socket.on('game:init', function (data) {
      console.log('game:init ' + !!data);
      if (data) {
        $scope.game = data.game;
      }
    })

    $scope.submitName = function () {
      $('#buzzer-name-input').hide();
      $('#buzzer-name').show();
      $('#buzzer-button').show();
    }

    function resetTimer() {
      $('.timer').removeClass('animated')
    }

    function startTimer() {
      $('.timer').addClass('animated')
    }

    socket.on('clue:start', function (_) {
      resetTimer();
    });

    socket.on('buzz:fail', function (playerName) {
      if ($('#buzzer-name').html() == playerName) {
        lockBuzzer();
      }
    });

    function lockBuzzer() {
      $('#buzzer-lock-warning').html('Buzzer Disabled!')
      $('#buzzer-button').prop('disabled', true)

      setTimeout(function () {
        $('#buzzer-lock-warning').html(' ')
        $('#buzzer-button').prop('disabled', false)
      }, 250)
    }

    socket.on('buzz:success', function (buzzedName) {
      var buzzerButton = $('#buzzer-button')
      //buzzerButton.prop('disabled', true);

      if ($('#buzzer-name').html() == buzzedName) {
        buzzerButton.css("background-color", "green");
        buzzerButton.html("Buzzed!");
        startTimer()

      } else {
        buzzerButton.css("background-color", "#c40d0a");
        buzzerButton.html("Locked");
      }
    });

    socket.on('final:start', function () {
      $('.final-jeopardy').show()
      $('#buzzer-button').hide()
    });

    socket.on('buzz:reset:success', function (data) {
      var buzzerButton = $('#buzzer-button')
      buzzerButton.css("background-color", "#0015a0");
      buzzerButton.html("Buzz");
      //buzzerButton.prop('disabled', false);
    });

    $scope.buzz = function (name) {
      socket.emit('buzz:attempt', {
        id: $scope.data.id,
        name: name
      })
    };

    $scope.submitWager = function (name, wager) {
      console.log('wager submitted');
      socket.emit('final_wager:submit', {
        id: $scope.data.id,
        wager: {
          name: name,
          wager_amount: wager
        }
      })
    };

    $scope.submitFinal = function (name, wager, answer) {
      socket.emit('final:submit', {
        id: $scope.data.id,
        answer: {
          'name': name,
          'wager': wager,
          'answer': answer
        }
      });
    };

  });
