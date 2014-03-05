// 
// The fetcher is responsible for fetching new 
// trades at the exchange. It will emit `trades batch`
// events as soon as it fetches new data.
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

  // Create a public dataProvider object which can retrieve live 
  // trade information from an exchange.

  this.watcher = new DataProvider(config.watch);
  this.lastFetch = false;

  this.batcher = new TradeBatcher;

  this.exchange = exchangeChecker.settings(config.watch);

  this.pair = [
    config.watch.asset,
    config.watch.currency
  ].join('/');

  // console.log(config);
  log.info('Starting to watch the market:',
    this.exchange.name,
    this.pair
  );

  this.batcher.on('new trades', this.relayTrades);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.start = function() {
  if(this.exchange.providesHistory)
    return util.die('Not supported yet');
  
  setTimeout(this.tick, util.minToMs(0.8));
  this.tick();
}

Fetcher.prototype.tick = function() {
  log.debug('Tick, triggering heartbeat.');
  _.defer(this.fetch);
}

Fetcher.prototype.fetch = function(since) {
  log.debug('Requested', this.pair ,'trade data from', this.exchange.name, '...');
  this.watcher.getTrades(since, this.processTrades, false);
}

Fetcher.prototype.processTrades = function(err, trades) {
  if(err)
    throw err;

  // Make sure we have trades to process
  if(_.isEmpty(trades)) {
    log.warn('Trade fetch came back empty. Refetching...');
    this.fetch();
    return;
  }

  this.batcher.write(trades);
}

Fetcher.prototype.relayTrades = function(batch) {
  console.log(batch);
  this.emit('trades batch', batch);
  this.emit('trade', batch.last);
}


module.exports = Fetcher;