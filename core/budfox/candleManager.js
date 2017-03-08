// The candleManager consumes trades and emits:
// - `candles`: array of minutly candles.
// - `candle`: the most recent candle after a fetch Gekko.

var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');

var util = require(__dirname + '/../util');
var dirs = util.dirs();
var config = util.getConfig();
var log = require(dirs.core + 'log');
var cp = require(dirs.core + 'cp');

var CandleCreator = require(dirs.budfox + 'candleCreator');

var Manager = function() {
  _.bindAll(this);

  this.candleCreator = new CandleCreator;

  this.candleCreator
    .on('candles', this.relayCandles);

  this.messageFirstCandle = _.once(candle => {
    cp.firstCandle(candle);
  })
};

util.makeEventEmitter(Manager);
Manager.prototype.processTrades = function(tradeBatch) {
  this.candleCreator.write(tradeBatch);
}

Manager.prototype.relayCandles = function(candles) {
  this.emit('candles', candles);

  if(!_.size(candles))
    return;

  this.messageFirstCandle(_.first(candles));
  cp.lastCandle(_.last(candles));
}

module.exports = Manager;
