/*
 * Serve content over a socket
 */

var _ = require("lodash");
var jsonfile = require("jsonfile");
var id,
  datas = {};

const { Client } = require("pg");

const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const locked = "LOCKED";

module.exports = function (io) {
  return function (socket) {
    socket.on("game:start", function (data) {
      console.log("game:start " + data.data.id);
      id = data.data.id;
      datas[id] = data;
      datas.current_game = id;
      data.game.round = "J";
      data.buzzed_player = "temp";
      data.game.previous_buzzers = [];
      io.emit("round:start", data);
    });

    socket.on("final_wager:submit", function (data) {
      console.log(
        "final_wager:submit " + data.id + data.wager.name,
        data.wager.wager_amount
      );
      datas[id].game.final_wagers.push(data.wager);
      io.emit("final_wager:submit:done", data.wager);
    });

    socket.on("final:submit", function (data) {
      console.log("final:submit " + data.id + data.answer);
      datas[id].game.final_answers.push(data.answer);
      io.emit("final:submit:done", data.answer);
    });

    socket.on("buzz:attempt", function (data) {
      id = data.id;
      if (datas[id] && datas[id].game.buzzed_player == null) {
        datas[id].game.buzzed_player = data.name;
        datas[id].game.previous_buzzers.push(data.name);
        io.emit("buzz:success", data.name);
      } else {
        io.emit("buzz:fail", data.name);
      }
    });

    socket.on("buzz:lock", function (id) {
      datas[id].game.buzzed_player = locked;
      io.emit("buzz:success", locked);
    });

    socket.on("stump:send", function () {});

    socket.on("buzz:reset", function (parent_id) {
      datas[parent_id].game.buzzed_player = null;
      io.emit("buzz:reset:success", datas[parent_id].game.previous_buzzers);
    });

    socket.on("round:end", function (data) {
      console.log("round:end " + data.round);
      if (data.round === "J") {
        data.round = "DJ";
        if (
          data.player_1.score < data.player_2.score &&
          data.player_1.score < data.player_3.score
        ) {
          data.control_player = "player_1";
        } else if (
          data.player_2.score < data.player_1.score &&
          data.player_2.score < data.player_3.score
        ) {
          data.control_player = "player_2";
        } else if (
          data.player_3.score < data.player_1.score &&
          data.player_3.score < data.player_2.score
        ) {
          data.control_player = "player_3";
        }
      } else if (data.round === "DJ") {
        data.round = "FJ";
        data.control_player = undefined;
        io.emit("final:start");
      } else if (data.round === "FJ") {
        data.round = "end";

        datas.current_game = null;

        var file = "games/" + id + "-" + new Date().getTime() + ".json";
        jsonfile.writeFileSync(file, data, { spaces: 2 });

        pgClient.connect();
        pgClient.query("", (err, db) => {
          if (err) {
            console.log("pg error: " + err);
          } else {
            // TODO - write who played this game
            // insert players here
          }
        });
      }
      datas[id].game = data;
      io.emit("round:start", datas[id]);
    });

    socket.on("board:init", function () {
      console.log("board:init");
      socket.emit("board:init", datas[id]);
    });

    socket.on("buzzer:init", function () {
      socket.emit("buzzer:init", datas[datas.current_game]);
    });

    socket.on("game:init", function (data) {
      console.log("game:init " + data);
      socket.emit("game:init", datas[data]);
    });

    socket.on("clue:start", function (data) {
      console.log("clue:start " + data);
      datas[id].game.previous_buzzers = [];
      socket.broadcast.emit("clue:start", data);
    });

    socket.on("clue:daily", function (data) {
      console.log("clue:daily");
      socket.broadcast.emit("clue:daily", data);
    });

    socket.on("clue:end", function (data) {
      console.log("clue:end");
      datas[id].game = data;
      socket.broadcast.emit("clue:end", data);
    });

    socket.on("game:reset", function (id) {
      // TODO - maybe reset mongo
    });

    socket.on("fj:reveal", function (playerId, playerInfo) {
      socket.broadcast.emit("fj:reveal", playerId, playerInfo);
      console.log("fj:reveal " + playerId + playerInfo);
    });

    socket.on("fj:reveal-wager", function (playerId, finalScore) {
      socket.broadcast.emit("fj:reveal-wager", playerId, finalScore);
    });
  };
};
