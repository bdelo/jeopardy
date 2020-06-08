/*
 * Serve content over a socket
 */

var _ = require('lodash');
var jsonfile = require('jsonfile');
var id, datas = {};

let
  redis = require('redis'),
  /* Values are hard-coded for this example, it's usually best to bring these in via file or environment variable for production */
  client = redis.createClient({
    port: 6379,               // replace with your port
    host: process.env.REDIS_HOST || '127.0.0.1',        // replace with your hostanme or IP address
    password: process.env.REDIS_PASSWORD || '',    // replace with your password
  });

client.on('error', function (err) {
  console.log('Redis error: ' + err);
});
const EPISODES_PLAYED_KEY = 'episodes-played'

module.exports = function (io) {
  return function (socket) {
    socket.on('game:start', function (data) {
      console.log('game:start ' + data.data.id);
      id = data.data.id;
      datas[id] = data;
      data.game.round = 'J';
      data.buzzed_player = 'temp';
      io.emit('round:start', data);
    });

    socket.on('final_wager:submit', function (data) {
      console.log('final_wager:submit ' + data.id + data.wager.name, data.wager.wager_amount);
      datas[id].game.final_wagers.push(data.wager);
      io.emit('final_wager:submit:done', data.wager)
    });

    socket.on('final:submit', function (data) {
      console.log('final:submit ' + data.id + data.answer);
      datas[id].game.final_answers.push(data.answer);
      io.emit('final:submit:done', data.answer)
    });

    socket.on('buzz:attempt', function (data) {
      id = data.id
      if (datas[id].game.buzzed_player == null) {
        datas[id].game.buzzed_player = data.name
        io.emit('buzz:success', data.name);
      }
    });

    socket.on('buzz:lock', function (id) {
      console.log('got lock')
      var placeholderName = '             '
      datas[id].game.buzzed_player == placeholderName
      io.emit('buzz:success', placeholderName);
    });

    socket.on('stump:send', function () {

    });

    socket.on('buzz:reset', function (parent_id) {
      datas[parent_id].game.buzzed_player = null
      io.emit('buzz:reset:success')
    });

    socket.on('round:end', function (data) {
      console.log('round:end ' + data.round);
      if (data.round === 'J') {
        data.round = 'DJ';
        if (data.player_1.score < data.player_2.score && data.player_1.score < data.player_3.score) {
          data.control_player = 'player_1';
        }
        else if (data.player_2.score < data.player_1.score && data.player_2.score < data.player_3.score) {
          data.control_player = 'player_2';
        }
        else if (data.player_3.score < data.player_1.score && data.player_3.score < data.player_2.score) {
          data.control_player = 'player_3';
        }
      }
      else if (data.round === 'DJ') {
        data.round = 'FJ';
        data.control_player = undefined;
        io.emit('final:start');
      }
      else if (data.round === 'FJ') {
        data.round = 'end';

        var file = 'games/' + id + '-' + new Date().getTime() + '.json';
        jsonfile.writeFileSync(file, data, { spaces: 2 });
        client.hset(EPISODES_PLAYED_KEY, id, true)
      }
      datas[id].game = data;
      io.emit('round:start', datas[id]);
    })

    socket.on('board:init', function () {
      console.log('board:init');
      socket.emit('board:init', datas[id]);
    });

    socket.on('game:init', function (data) {
      console.log('game:init ' + data);
      socket.emit('game:init', datas[data]);
    });

    socket.on('clue:start', function (data) {
      console.log('clue:start ' + data);
      socket.broadcast.emit('clue:start', data);
    });

    socket.on('clue:daily', function (data) {
      console.log('clue:daily');
      socket.broadcast.emit('clue:daily', data);
    });

    socket.on('clue:end', function (data) {
      console.log('clue:end');
      datas[id].game = data;
      socket.broadcast.emit('clue:end', data);
    });

    socket.on('game:reset', function (id) {
      client.hdel(EPISODES_PLAYED_KEY, id);
    })
  };
};
