var _ = require('lodash');
var config = require('../../core/util.js').getConfig();

var handle = require('./handle');
var sqliteUtil = require('./util');

var Store = function(done, pluginMeta) {
  _.bindAll(this);
  this.done = done;

  this.db = handle;
  this.db.serialize(this.upsertTables);

  this.cache = [];
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
        trades INTEGER NOT NULL
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

Store.prototype.writeCandles = function() {
  if(_.isEmpty(this.cache))
    return;

  var stmt = this.db.prepare(`
    INSERT OR IGNORE INTO ${sqliteUtil.table('candles')}
    VALUES (?,?,?,?,?,?,?,?,?)
  `);

  _.each(this.cache, candle => {
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
  });

  stmt.finalize();

  this.cache = [];
}

var processCandle = function(candle, done) {

  // because we might get a lot of candles
  // in the same tick, we rather batch them
  // up and insert them at once at next tick.
  this.cache.push(candle);
  _.defer(this.writeCandles);

  // NOTE: sqlite3 has it's own buffering, at
  // this point we are confident that the candle will
  // get written to disk on next tick.
  done();
}

if(config.candleWriter.enabled)
  Store.prototype.processCandle = processCandle;

// TODO: add storing of trades / advice?

// var processTrades = function(candles) {
//   util.die('NOT IMPLEMENTED');
// }

// var processAdvice = function(candles) {
//   util.die('NOT IMPLEMENTED');
// }

// if(config.tradeWriter.enabled)
//  Store.prototype.processTrades = processTrades;

// if(config.adviceWriter.enabled)
//   Store.prototype.processAdvice = processAdvice;

module.exports = Store;
