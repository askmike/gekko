
var _ = require('lodash');
var moment = require('moment');

var log = require('./log.js');
var utc = moment.utc;
var TradeFetcher = require('./tradeFetcher');
var CandleManager = require('./candleManager');

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

  this.candleSize = tradingAdvisor.candleSize;
  this.candleParts = [];
  
  this.state = 'pending';

  this.watching = false;

  this.model.on('history', this.relayHistory);
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

  this.candleParts.push(candle);

  if(_.size(this.candleParts) % this.candleSize === 0) {
    var candle = this.calculateCandle(this.candleParts);
    this.emit('candle', candle); 
  }
}

Manager.prototype.relayHistory = function(history) {
  log.debug('relaying history');
  this.relayCandles();
  this.state = 'relaying candles';
  this.emit('history', history);
}

Manager.prototype.relayCandles = function() {
  log.debug('~relay candles');
  this.model.on('candle', this.processSmallCandle);
}

Manager.prototype.calculateCandle = function(fakeCandles) {
  var first = fakeCandles.shift();
  var firstCandle = _.clone(first.candle);

  firstCandle.p = firstCandle.p * firstCandle.v;
  firstCandle.start = this.model.minuteToMoment(firstCandle.s, first.day.m);

  // create a fake candle based on all real candles
  var candle = _.reduce(
    fakeCandles,
    function(candle, m) {
      m = m.candle;
      candle.h = _.max([candle.h, m.h]);
      candle.l = _.min([candle.l, m.l]);
      candle.c = m.c;
      candle.v += m.v;
      candle.p += m.p * m.v;
      return candle;
    },
    firstCandle
  );

  if(candle.v)
    // we have added up all prices (relative to volume)
    // now divide by volume to get the Volume Weighted Price
    candle.p /= candle.v;
  else
    // empty candle
    candle.p = candle.o;

  return candle;
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
    log.info('No (recent) history found');
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