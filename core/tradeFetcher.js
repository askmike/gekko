// 
// The fetcher is responsible for fetching new 
// trades at the exchange on interval. It will emit
// the following events:
// 
// - `trades batch` - all new trades.
// - `trade` - the most recent trade after every fetch
// 

var _ = require('lodash');
var moment = require('moment');
var utc = moment.utc;
var log = require('./log.js');

var util = require('./util');
var config = util.getConfig();

var exchangeChecker = require('./exchangeChecker');
var TradeBatcher = require('./tradeBatcher');

var provider = config.watch.exchange.toLowerCase();
var DataProvider = require('../exchanges/' + provider);

var Fetcher = function() {
  _.bindAll(this);

  // interval between fetches in seconds
  this.heartrate = 40;

  // Create a public dataProvider object which can retrieve live 
  // trade information from an exchange.

  this.watcher = new DataProvider(config.watch);
  this.lastFetch = false;  

  this.exchange = exchangeChecker.settings(config.watch);

  this.batcher = new TradeBatcher(this.exchange.tid);

  this.pair = [
    config.watch.asset,
    config.watch.currency
  ].join('/');

  log.info('Starting to watch the market:',
    this.exchange.name,
    this.pair
  );

  this.tries = 0;

  this.batcher.on('new batch', this.relayTrades);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.start = function() {
  if(this.exchange.providesHistory)
    return util.die('Not supported yet');
  
  // console.log(this.heartrate, +moment.duration(this.heartrate, 's'));

  setInterval(this.tick, +moment.duration(this.heartrate, 's'));
  this.tick();
}

Fetcher.prototype.tick = function() {
  log.debug('Tick, triggering heartbeat.');
  this.tries = 0;
  _.defer(this.fetch);
}

Fetcher.prototype.fetch = function(since) {
  if(++this.tries >= this.heartrate)
    return;

  log.debug('Requested', this.pair ,'trade data from', this.exchange.name, '...');
  this.watcher.getTrades(since, this.processTrades, false);
}

Fetcher.prototype.processTrades = function(err, trades) {
  if(err)
    throw err;

  // Make sure we have trades to check
  if(_.isEmpty(trades)) {
    log.debug('Trade fetch came back empty, assuming no new trades.');

    // Kraken only gives back new trades, refetching will
    // cross rate limits
    // setTimeout(this.fetch, +moment.duration('s', 1));
    return;
  }

  this.batcher.write(trades);
}

Fetcher.prototype.relayTrades = function(batch) {
  this.emit('trades batch', batch);
  this.emit('trade', batch.last);
}


module.exports = Fetcher;