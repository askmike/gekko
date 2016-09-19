var _ = require('lodash');
var config = require('../../core/util.js').getConfig();

var handle = require('./handle');
var postgresUtil = require('./util');

var Store = function(done, pluginMeta) {
  _.bindAll(this);
  this.done = done;

  this.db = handle;
  this.upsertTables();

  this.cache = [];
}

Store.prototype.upsertTables = function() {
  var createQueries = [
    `CREATE TABLE IF NOT EXISTS
    ${postgresUtil.table('candles')} (
      id BIGSERIAL PRIMARY KEY,
      start integer UNIQUE,
      open double precision NOT NULL,
      high double precision NOT NULL,
      low double precision NOT NULL,
      close double precision NOT NULL,
      vwp double precision NOT NULL,
      volume double precision NOT NULL,
      trades INTEGER NOT NULL
    );`
  ];

  var next = _.after(_.size(createQueries), this.done);

  _.each(createQueries, function(q) {
    this.db.query(q,next);
  }, this);
}

Store.prototype.writeCandles = function() {
  if(_.isEmpty(this.cache)){
    return;
  }

  var stmt = `
  INSERT INTO ${postgresUtil.table('candles')}
  (start, open, high,low, close, vwp, volume, trades)
  values($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING;
  `;

  _.each(this.cache, candle => {
    this.db.query(stmt,[
      candle.start.unix(),
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      candle.vwp,
      candle.volume,
      candle.trades
    ]);
  });

  this.cache = [];
}

var processCandle = function(candle, done) {

  // because we might get a lot of candles
  // in the same tick, we rather batch them
  // up and insert them at once at next tick.
  this.cache.push(candle);
  _.defer(this.writeCandles);
  done();
}

if(config.candleWriter.enabled){
  Store.prototype.processCandle = processCandle;
}

module.exports = Store;
