var _ = require('lodash');
const log = require('../../core/log');
var config = require('../../core/util.js').getConfig();

var handle = require('./handle');
var postgresUtil = require('./util');

var Store = function(done, pluginMeta) {
  _.bindAll(this);
  this.done = done;
  this.db = handle;
  this.cache = [];
  done();
}

Store.prototype.writeCandles = function() {
  if(_.isEmpty(this.cache)){
    return;
  }

  //log.debug('Writing candles to DB!');
  _.each(this.cache, candle => {
    var stmt =  `
    BEGIN; 
    LOCK TABLE ${postgresUtil.table('candles')} IN SHARE ROW EXCLUSIVE MODE; 
    INSERT INTO ${postgresUtil.table('candles')} 
    (start, open, high,low, close, vwp, volume, trades) 
    VALUES 
    (${candle.start.unix()}, ${candle.open}, ${candle.high}, ${candle.low}, ${candle.close}, ${candle.vwp}, ${candle.volume}, ${candle.trades}) 
    ON CONFLICT ON CONSTRAINT ${postgresUtil.startconstraint('candles')} 
    DO NOTHING; 
    COMMIT; 
    `;
    
    this.db.connect((err,client,done) => {
      client.query(stmt, (err, res) => {
        done();
        if (err) {
          log.debug(err.stack)
        } else {
          //log.debug(res)
        }
      });
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
