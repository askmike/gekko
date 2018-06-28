var _ = require('lodash');
const log = require('../../core/log');
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

  //log.debug('Writing candles to DB!');
  _.each(this.cache, candle => {
    var stmt =  `
    BEGIN; 
    LOCK TABLE candles_eur_eth IN SHARE ROW EXCLUSIVE MODE; 
    INSERT INTO candles_eur_eth 
    (start, open, high,low, close, vwp, volume, trades) 
    VALUES 
    (${candle.start.unix()}, ${candle.open}, ${candle.high}, ${candle.low}, ${candle.close}, ${candle.vwp}, ${candle.volume}, ${candle.trades}) 
    ON CONFLICT ON CONSTRAINT candles_eur_eth_start_key 
    DO NOTHING; 
    COMMIT; 
    `;
  
    this.db.query(stmt, (err, res) => {
      if (err) {
        log.debug(err.stack)
      } else {
        //log.debug(res)
      }
    });
  });

  this.cache = [];
}

var processCandle = function(candle, done) {
  this.cache.push(candle);
  if (this.cache.length > 1) 
    this.writeCandles();

  done();
};

var finalize = function(done) {
  this.writeCandles();
  this.db = null;
  done();
}

if(config.candleWriter.enabled) {
  Store.prototype.processCandle = processCandle;
  Store.prototype.finalize = finalize;
}

module.exports = Store;
