/*
 * Serve JSON to our AngularJS client
 */

var request = require("request");
var cheerio = require("cheerio");
var _ = require("lodash");

const { Client } = require("pg");

const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

function exportIndex(req, res, next) {
  return function (error, response, html) {
    dbResult = {};

    //TODO - pull back who's played this game
    //pgClient.connect();
    // pgClient.query("", (err, result) => {
    //   if (err) {
    //     console.log("pg error: " + err);
    //   } else {
    //     pgClient.end();
    //     result.forEach(function (r) {
    //       if (!dbResult[r.episode_id]) {
    //         dbResult[r.episode_id] = new Set();
    //       }
    //       names = r.player_names || [];
    //       names.forEach(function (name) {
    //         dbResult[r.episode_id].add(name);
    //       });
    //     });
    //   }
    // });

    if (!error) {
      var $ = cheerio.load(html),
        result = [];
      $("#content table tr").each(function () {
        var data = $(this),
          row = [];
        data.children().each(function (i, element) {
          if (i == 0) {
            var link = $("a", element).first().attr("href");
            link = link.substring(link.indexOf("=") + 1, link.length);
            row.push(link);
          }
          row.push($(element).text().trim());
        });
        var playedInfo = Array.from(dbResult[row[0]] || []).join(", ");
        row.push(playedInfo);
        result.push(
          _.zipObject(["id", "name", "description", "note", "playedInfo"], row)
        );
      });

      res.json(result);
    } else {
      next(error);
    }
  };
}

function exportRound($, context, r) {
  var result = {};
  var round = $(r !== "FJ" ? "table.round" : "table.final_round", context);

  // Export categories
  $("tr", round)
    .first()
    .children()
    .each(function (i, element) {
      var data = $(this);
      result[["category", r, i + 1].join("_")] = {
        category_name: $(".category_name", data).text(),
        category_comments: $(".category_comments", data).text(),
        media: $("a", data).length
          ? $("a", data)
            .map(function (i, element) {
              return $(this)
                .attr("href")
                .replace(
                  "http://www.j-archive.com/",
                  "http://localhost:3000/"
                );
            })
            .toArray()
          : undefined,
      };
    });

  // Export clues
  $(".clue_text", round).each(function (i, element) {
    var data = $(this);
    var header = data.parent().prev();
    if (r === "FJ") {
      header = data.parent().parent().parent().parent().prev();
    }


    var answerHtml = data.parent().parent().parent().find(".correct_response");
    // var answerHtml = _.trimStart(
    //   _.trimEnd($("div", header).attr("onclick"), ")"),
    //   "toggle("
    // )
    //   .split(", ")
    //   .slice(2)
    //   .join(", ");
    // answerHtml = _.trim(_.trim(answerHtml), "'")
    //   .replace('\\"', '"')
    //   .replace('\\"', '"');
    var link = $(".clue_order_number a", header).attr("href");
    var daily_double = header.find(".clue_value_daily_double").length;

    result[data.attr("id")] = {
      id: link ? link.substring(link.indexOf("=") + 1, link.length) : undefined,
      daily_double: daily_double ? true : undefined,
      triple_stumper: _.includes(answerHtml, "Triple Stumper") || undefined,
      clue_html: data.html(),
      clue_text: data.text(),
      correct_response: answerHtml.html(), //answerHtml,//(".correct_response.right").text(),
      media: $("a", data).length
        ? $("a", data)
          .map(function (i, element) {
            return $(this)
              .attr("href")
              .replace("http://www.j-archive.com/", "http://localhost:3000/");
          })
          .toArray()
        : undefined,
    };
  });
  return result;
}

exports.seasons = function (req, res, next) {
  request(
    "http://www.j-archive.com/listseasons.php",
    exportIndex(req, res, next)
  );
};

exports.season = function (req, res, next) {
  request(
    "http://www.j-archive.com/showseason.php?season=" + req.params.id,
    exportIndex(req, res, next)
  );
};

exports.game = function (req, res, next) {
  request(
    "http://www.j-archive.com/showgame.php?game_id=" + req.params.id,
    function (error, response, html) {
      if (!error) {
        var $ = cheerio.load(html);

        var result = {
          id: req.params.id,
          game_title: $("#game_title").text(),
          game_comments: $("#game_comments").text(),
          game_complete: false,
        };

        _.assign(
          result,
          exportRound($, $("#jeopardy_round"), "J"),
          exportRound($, $("#double_jeopardy_round"), "DJ"),
          exportRound($, $("#final_jeopardy_round"), "FJ")
        );

        result.game_complete =
          _.countBy(_.keys(result), function (n) {
            return n.split("_")[0];
          }).clue ===
          30 + 30 + 1;

        var clueCounts = _.countBy(_.keys(result), function (n) {
          return n.split("_").slice(0, 3).join("_");
        });

        _.forEach(result, function (n, key) {
          if (_.startsWith(key, "category")) {
            n.clue_count = clueCounts[key.replace("category", "clue")];
          }
        });

        res.json(result);
      } else {
        next(error);
      }
    }
  );
};
