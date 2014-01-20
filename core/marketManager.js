
var _ = require('lodash');
var moment = require('moment');

var log = require('./log.js');
var utc = moment.utc;
var TradeFetcher = require('./tradeFetcher');
var CandleManager = require('./candleManager');
var CandleConverter = require('./candleConverter');

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

  this.model = new CandleManager;
  this.fetcher = new TradeFetcher;
  
  this.state = 'pending';

  this.watching = false;

  this.candleConverter = new CandleConverter(tradingAdvisor.candleSize);

  this.model.on('history', this.processHistory);
  this.model.on('history state', this.processHistoryState);
  this.fetcher.on('new trades', this.model.processTrades);
  this.fetcher.on('new trades', this.relayTrade);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

Manager.prototype.start = function() {
  log.debug('~market start');
  this.model.checkHistory();
}

Manager.prototype.processSmallCandle = function(candle) {
  this.emit('small candle', candle);

  if(this.state !== 'relaying candles')
    return;

  this.candleConverter.write(candle);
}

Manager.prototype.processHistory = function(history) {
  log.debug('relaying history');
  this.relayCandles();
  this.state = 'relaying candles';

  _.each(history.candles, function(c) {
    this.candleConverter.write(c)
  }, this);
}

Manager.prototype.relayCandles = function() {
  this.model.on('candle', this.processSmallCandle);
  this.candleConverter.on('candle', this.relayCandle);
}

Manager.prototype.relayCandle = function(candle) {
  this.emit('candle', candle);
}


// only relay if this has not been relied before.
Manager.prototype.relayTrade = function(data) {
  var trade = data.last;
  if(_.isEqual(trade, this.lastTrade))
    return;
  
  this.emit('trade', trade);
  this.lastTrade = trade;
}

Manager.prototype.processHistoryState = function(history) {
  if(history.state === 'not required') {
    this.state = 'relaying candles';
    this.relayCandles();
  } else if(history.state === 'full') {
    log.debug('full history available');
  } else if(history.empty) {
    log.debug('No (recent) history found');
  } else {
    log.info(
      'Partly history found,',
      'from',
      history.first.m.format('YYYY-MM-DD HH:mm:ss'),
      'UTC to',
      history.last.m.format('YYYY-MM-DD HH:mm:ss'),
      'UTC'
    );
  }

  if(!this.watching)
    this.watchMarket();
}

Manager.prototype.watchMarket = function() {
  log.debug('~watch market');
  this.watching = true;
  this.fetcher.start();
}


// var a = new Manager;
module.exports = Manager;