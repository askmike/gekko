// 
// The fetcher is responsible for fetching new 
// trades at the exchange. It will emit `new trades`
// events as soon as it fetches new data.
// 
// How often this is depends on:
// 
//  - The capability of the exchange (to provide
//  historical data).
//  - The amount of data we get per fetch.
//  - The interval at which we need new data.
// 
// 
// 

var cexio = require('cexio');
var _ = require('lodash');
var moment = require('moment');
var utc = moment.utc;
var log = require('./log.js');

var util = require('./util');
var config = util.getConfig();

var exchangeChecker = require('./exchangeChecker');

var provider = config.watch.exchange.toLowerCase();
var DataProvider = require('./exchanges/' + provider);

var Fetcher = function() {
  _.bindAll(this);

  // Create a public dataProvides object which can retrieve live 
  // trade information from an exchange.

  this.watcher = new DataProvider(config.watch);
  this.lastFetch = false;

  this.exchange = exchangeChecker.settings(config.watch);

  this.fetch();
}

// we need to keep polling exchange because we cannot
// access older data. We need to calculate how often we
// we should poll.
// 
// *This method is only used if this exchange does not support
// historica data*
Fetcher.prototype.calculateNextFetch = function(trades) {
  var first = _.first(trades); 
  this.first = moment.unix(first.date).utc();
  var last = _.last(trades);
  this.last = moment.unix(last.date).utc();

  var fetchTimespan = util.calculateTimespan(this.first, this.last);
  var minimalInterval = util.minToMs(config.EMA.interval);
  
  // if we got the last 150 seconds of trades last
  // time make sure we fetch at least in 100 seconds
  // again.
  var safeTreshold = 1.5;

  if(fetchTimespan / safeTreshold > minimalInterval)
    // If the oldest trade in a fetch call > ema.interval
    // we can just use ema.interval.
    var fetchAfter = minimalInterval;
  else
    // If the oldest trade in a fetch call < ema.interval
    // we fetch once every minute until we can determine a
    // better interval based on history.
    var fetchAfter = util.minToMs(1);

  log.debug('Scheduling next fetch in', util.msToMin(fetchAfter), 'minute');
  return fetchAfter;
}

Fetcher.prototype.scheduleNextFetch = function(at) {
  setTimeout(this.fetch, at);
}

Fetcher.prototype.fetch = function() {
  this.watcher.getTrades(null, this.processTrades, false);
}

Fetcher.prototype.processTrades = function(err, trades) {
  if(err)
    throw err;

  // schedule next fetch
  if(!this.exchange.providesHistory) {
    var at = this.calculateNextFetch(trades);
    this.scheduleNextFetch(at);
  }
    
  else
    console.log('wup wup refetching because this exchange supports it');

  
  this.emit('new trades', {
    start: this.first,
    end: this.last,
    all: trades
  });
}


module.exports = Fetcher;