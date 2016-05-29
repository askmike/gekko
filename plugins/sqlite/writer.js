var _ = require('lodash');
var config = require('../../core/util.js').getConfig().sqliteWriter;

var handle = require('./handle');
var sqliteUtil = require('./util');

var Store = function(done, pluginMeta) {
  _.bindAll(this);
  this.done = done;

  this.db = handle;
  this.db.serialize(this.upsertTables);
}

Store.prototype.upsertTables = function() {
  var createQueries = [
    `
      CREATE TABLE IF NOT EXISTS
      ${sqliteUtil.table('candles')} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start INTEGER UNIQUE,
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        vwp REAL NOT NULL,
        volume REAL NOT NULL,
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
    INSERT OR IGNORE INTO ${sqliteUtil.table('candles')} VALUES (?,?,?,?,?,?,?,?,?)
  `);

  stmt.run(
    null,
    candle.start.unix(),
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.vwp,
    candle.volume,
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

if(config.storeCandles)
  Store.prototype.processCandle = processCandle;

if(config.storeTrades)
 Store.prototype.processTrades = processTrades;

if(config.storeAdvice)
  Store.prototype.processAdvice = processAdvice;

module.exports = Store;