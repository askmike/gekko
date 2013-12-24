
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

  if(!config.backtest.enabled) {
    // watch the market
    var TradeFetcher = require('./tradeFetcher');
    this.fetcher = new TradeFetcher;
    // we pass a fetch to the model right away
    // so it knows how new the history needs to be
    this.fetcher.once('new trades', this.model.init);
    this.fetcher.on('new trades', this.model.processTrades);

    // this.model.on('history', this.processHistory);

  this.model.on('historical data outdated', function() {
    log.warning(
      'Gekko found a dataset, but it\'s outdated',
      'this causes a gap in the data and means we need',
      'to build up a new history'
    );
  });

  } else
    console.log('WUP WUP this.backtest();');

}

Manager.prototype.setupAdvice = function() {
  console.log('we got all history we need, lets rock');
}

Manager.prototype.processHistory = function(history) {
  // if history is not in this region we should discard
  var minimum = util.intervalsAgo(config.EMA.candles);

  if(!this.exchange.providesHistory) {
    // If we don't have nor are able to
    // fetch historical data wait until 
    // we do.
    if(!history) {
      log.info('Gekko could not find any historical data');
      this.sleep(utc().diff(minimum));
    } else if(minimum > history.start) {
      log.info('Gekko could find partial history, but not enough to start');
      this.sleep(history.start.diff(minimum));
    } else {
      // history is ok
      this.setupAdvice();
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