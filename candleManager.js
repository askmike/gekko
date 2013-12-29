
// - Feeding candles to a trading method

var _ = require('lodash');
var log = require('./log.js');
var moment = require('moment');
var utc = moment.utc;

var exchangeChecker = require('./exchangeChecker');

var util = require('./util');
var config = util.getConfig();

var Manager = function() {
  _.bindAll(this);

  this.exchange = exchangeChecker.settings(config.watch);
  this.model = require('./databaseManager');
  this.model.setRealCandleSize(config.EMA.interval);

  this.state = 'calculating';
  // calculating - 


  if(config.backtest.enabled) {
    console.log('WUP WUP this.backtest();');
  } else {
    // watch the market
    var TradeFetcher = require('./tradeFetcher');
    this.fetcher = new TradeFetcher;

    // we pass a fetch to the model right away
    // so it knows how new the history needs to be
    this.fetcher.once('new trades', this.model.init);
    this.model.on('history', this.processHistory);

    this.model.once('history', _.bind(function(history) {
      // the first time the model first needs to calculate
      // the available history, after it did this it will
      // process the trades itself
      this.fetcher.on('new trades', this.model.processTrades);
    }, this));
  }
}

Manager.prototype.setupAdvice = function() {
  console.log('we got all history we need, lets rock');
}

Manager.prototype.processHistory = function(history) {
  var requiredHistory = util.minToMs(config.EMA.candles * config.EMA.interval);

  if(!this.exchange.providesHistory) {
    if(history.empty) {
      // we don't have any history yet
      log.info('No history found, starting to build one now');
      var startAt = utc().add('ms', requiredHistory);
      log.info(
        'Expected to start giving advice',
        startAt.fromNow(),
        '(' + startAt.format('YYYY-MM-DD HH:mm:ss') + ' UTC)'
      );
    } else if(!history.complete) {
      // we do have history but it's not complete
      log.debug('History found, but not enough to start giving advice');
      log.info(
        'I have history since',
        history.start.fromNow(),
        '(' + history.start.format('YYYY-MM-DD HH:mm:ss') + ' UTC)'
      );
      var startAt = history.start.clone().add('ms', requiredHistory);
      log.info(
        'Expected to start giving advice', 
        startAt.fromNow(),
        '(' + startAt.format('YYYY-MM-DD HH:mm:ss') + ' UTC)'
      );
    } else {
      // we have complete history
      log.info('Full history available');
      console.log('GOT FULL HISTORY, SIZE:', history.candles.length);
    }
  }

}

// we don't got any history and we can't get it
// from the exchange, watch until we fetched for
// interval * candles
Manager.prototype.sleep = function(ms) {
  console.log('we are going to wait a loooong time :(', ms);
}

Manager.prototype.fetchHistory = function(since) {
 console.log('we dont got any history, so lets fetch it!', since); 
}


// var a = new Manager;
module.exports = Manager;