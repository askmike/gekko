
var _ = require('lodash');
var moment = require('moment');

var log = require('./log.js');
var utc = moment.utc;
var TradeFetcher = require('./tradeFetcher');
var CandleManager = require('./candleManager');
var CandleConverter = require('./candleConverter');
var CandleBatcher = require('./candleBatcher');

var exchangeChecker = require('./exchangeChecker');

var moment = require('moment');
var utc = moment.utc;
var util = require('./util');

var config = util.getConfig();
var backtest = config.backtest;
var tradingAdvisor = config.tradingAdvisor;

var Manager = function() {
  _.bindAll(this);

  this.exchange = exchangeChecker.settings(config.watch);

  // fetch trades
  this.fetcher = new TradeFetcher;
  // convert trades to candles
  this.candleBatcher = new CandleBatcher;


  // convert all 1min candles to required size
  // this.candleConverter = new CandleConverter(tradingAdvisor.candleSize);

  // process newly fetched trades trades
  this.fetcher.on('trades batch', this.relayTrades);
  this.fetcher.on('trades batch', this.candleBatcher.write);

  // process small candles
  // this.candleBatcher.on('')
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

Manager.prototype.start = function() {
  this.fetcher.start();
}

Manager.prototype.processSmallCandle = function(candle) {
  this.emit('small candle', candle);
  this.candleConverter.write(candle);
}

Manager.prototype.relayCandles = function() {
  this.candleConverter.on('candle', this.relayCandle);
}

Manager.prototype.relayCandle = function(candle) {
  this.emit('candle', candle);
}

Manager.prototype.relayTrades = function(batch) {
  this.emit('trades', batch);
}

Manager.prototype.relayTrade = function(trade) {
  this.emit('trade', trade);
}


// var a = new Manager;
module.exports = Manager;