// The candleManager consumes trades and emits:
// - `candles`: array of minutly candles
// - `candle`: after Gekko got new candles,
//   this will be the most recent one.

var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');

var util = require('./util');
var CORE = util.dirs().core;
var config = util.getConfig();
var log = require(CORE + 'log');

var CandleCreator = require(CORE + 'candleCreator');
var CandleBatcher = require(CORE + 'candleBatcher');

var Manager = function() {
  _.bindAll(this);

  this.candleCreator = new CandleCreator;

  this.candleCreator
    .on('candles', this.relayFreshCandles);

  // TODO:
  // if config.tradingAdvisor is enabled we need to
  // 
};

util.makeEventEmitter(Manager);

// HANDLERS
Manager.prototype.onStart = function() {
  if(util.gekkoMode() === 'realtime') {
    // we need to load the most recent history
    // and already broadcast those candles
    // 
    // TODO: finish
    // var since = config.since...
    // database.getCandles(since, this.relayExistingCandles)
    this.relayExistingCandles({amount: 0, data: []});
  }
}
Manager.prototype.onTrades = function(tradeBatch) {
  this.candleCreator.write(tradeBatch);
}

// EMITTERS
Manager.prototype.relayFreshCandles = function(candles) {
  this.emit('candles', _.assign(candles, {fresh: true}));
}
Manager.prototype.relayExistingCandles = function(candles) {
  this.emit('candles', _.assign(candles, {fresh: false}));
  this.emit('ready');
}


module.exports = Manager;
