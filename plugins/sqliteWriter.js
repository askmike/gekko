var _ = require('lodash');

var util = require('../core/util.js');
var config = util.getConfig();

if(config.debug)
  var sqlite3 = require('sqlite3').verbose();
else
  var sqlite3 = require('sqlite3');

var fs = require('fs');
var semver = require('semver');

var watch = config.watch;
var settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset],
  historyPath: config.history.directory
}



var table = function(name) {
  return [name, settings.pair.join('_')].join('_');
}

var Store = function(done, pluginMeta) {
  _.bindAll(this);

  if(!fs.existsSync(settings.historyPath))
    fs.mkdirSync(settings.historyPath);

  var dbName = pluginMeta.version + '.db';

  this.done = done;

  this.db = new sqlite3.Database(config.history.directory + dbName + '.db');
  this.db.serialize(this.upsertTables);
}

Store.prototype.upsertTables = function() {

  var createQueries = [
    `
      CREATE TABLE IF NOT EXISTS
      ${table('candles')} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start INTEGER UNIQUE,
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        vwp REAL NOT NULL,
        trades INTERGER NOT NULL
      );
    `,

    // TODO: create trades
    // ``

    // TODO: create advices
    // ``
  ];

  var next = _.after(_.size(createQueries), this.done);

  _.each(createQueries, function(q) {
    this.db.run(q, next);
  }, this);
}

var processCandle = function(candle) {
  var stmt = this.db.prepare(`
    INSERT OR IGNORE INTO ${table('candles')} VALUES (?,?,?,?,?,?,?,?)
  `);

  stmt.run(
    null,
    candle.start.unix(),
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.vwp,
    candle.trades
  );

  stmt.finalize();
}

var processTrades = function(candles) {
  util.die('NOT IMPLEMENTED');
}

var processAdvice = function(candles) {
  util.die('NOT IMPLEMENTED');
}

if(config.sqliteWriter.storeCandles)
  Store.prototype.processCandle = processCandle;

if(config.sqliteWriter.storeTrades)
 Store.prototype.processTrades = processTrades;

if(config.sqliteWriter.storeAdvice)
  Store.prototype.processAdvice = processAdvice;

module.exports = Store;