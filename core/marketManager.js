
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

  this.watching = false;

  this.model.on('history state', this.processHistoryState);
  this.fetcher.on('new trades', this.model.processTrades);
  // this.model.on('real candle', this.processCandle);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

Manager.prototype.start = function() {

  this.model.checkHistory();
  return;

  this.fetcher.on('new trades', this.relayTrade);
  this.model.on('history', this.processHistory);
  this.model.on('real candle', this.relayCandle);
  this.model.on('fake candle', this.relaySmallCandle);
}

Manager.prototype.relayCandle = function(candle) {
  this.emit('candle', candle);
}

Manager.prototype.relaySmallCandle = function(candle) {
 this.emit('small candle', candle); 
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

  if(history.state === 'full')
    log.debug('full history available');
  else if(history.empty) {
    // TODO: we only know this after fetch, don't relay
    // we get only trades from now
    log.info(
      'No (recent) history found');
    // ',',
    //   'history ready at',
    //   history.completeAt.format('YYYY-MM-DD HH:mm:ss'),
    //   'UTC (in ' + history.completeAt.fromNow(true) + ')'
    // );
  } else {
    log.info(
      'Partly history found',
      '(since',
      history.first.m.format('YYYY-MM-DD HH:mm:ss'),
      'UTC)'
    );
    // TODO: we only know this after fetch, don't relay
    // we get only trades from now
    // log.info(
    //   'Expected ready at',
    //   history.completeAt.format('YYYY-MM-DD HH:mm:ss'),
    //   'UTC (in ' + history.completeAt.fromNow(true) + ')'
    // )
  }

  if(!this.watching)
    this.watchMarket();
}

Manager.prototype.watchMarket = function() {
  this.watching = true;
  this.fetcher.start();
}

Manager.prototype.fetchHistory = function(since) {
 console.log('we dont got any history, so lets fetch it!', since); 
}


// var a = new Manager;
module.exports = Manager;