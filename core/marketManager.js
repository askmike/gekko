// 
// The market manager broadcasts market events about the 
// realtime market:
// 
// - `candles`: array of minutly candles
// - `candle`: after Gekko got new candles,
//   this will be the most recent one.
// - `trades`: batch of newly detected trades
// - `trade`: after Gekko fetched new trades, this
//   will be the most recent one.

var _ = require('lodash');
var moment = require('moment');
var utc = moment.utc;

var util = require('./util');
var log = require('./log.js');
var TradeFetcher = require('./tradeFetcher');
var CandleManager = require('./candleManager');
var CandleConverter = require('./candleConverter');
var CandleBatcher = require('./candleBatcher');

var exchangeChecker = require('./exchangeChecker');

var config = util.getConfig();

var Manager = function() {
  _.bindAll(this);

  // exchange settings
  this.exchange = exchangeChecker.settings(config.watch);

  // fetch trades
  this.fetcher = new TradeFetcher;
  // convert trades to minutly candles
  this.candleBatcher = new CandleBatcher;

  // process newly fetched trades trades
  this.fetcher.on('trades batch', this.relayTrades);
  this.fetcher.on('trades batch', this.candleBatcher.write);

  // relay candles
  this.candleBatcher.on('candles', this.relayCandles);
  this.candleBatcher.on('candles', this.relayCandle);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

Manager.prototype.start = function() {
  this.fetcher.start();
}

Manager.prototype.relayCandles = function(candles) {
  this.emit('candles', candles);
}

Manager.prototype.relayTrades = function(batch) {
  this.emit('trades', batch);
}

Manager.prototype.relayCandle = function(candles) {
  this.emit('candle', _.last(candles));
}

Manager.prototype.relayTrade = function(trade) {
  this.emit('trade', trade);
}

module.exports = Manager;