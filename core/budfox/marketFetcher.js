// 
// The fetcher is responsible for fetching new 
// market data at the exchange on interval. It will emit
// the following events:
// 
// - `trades batch` - all new trades.
// - `trade` - the most recent trade after every fetch

var _ = require('lodash');
var moment = require('moment');
var utc = moment.utc;
var util = require(__dirname + '/../util');

var config = util.getConfig();
var log = require(util.dirs().core + 'log');
var exchangeChecker = require(util.dirs().core + 'exchangeChecker');

var TradeBatcher = require(util.dirs().budfox + 'tradeBatcher');

var Fetcher = function(config) {
  if(!_.isObject(config))
    throw 'TradeFetcher expects a config';

  var provider = config.watch.exchange.toLowerCase();
  var DataProvider = require(util.dirs().gekko + 'exchanges/' + provider);
  _.bindAll(this);

  // Create a public dataProvider object which can retrieve live 
  // trade information from an exchange.
  this.watcher = new DataProvider(config.watch);

  this.exchange = exchangeChecker.settings(config.watch);

  var requiredHistory = config.tradingAdvisor.candleSize * config.tradingAdvisor.historySize;

  // If the trading adviser is enabled we might need a very specific fetch since
  // to line up [local db, trading method, and fetching]
  if(config.tradingAdvisor.enabled && config.tradingAdvisor.firstFetchSince) {
    this.firstSince = config.tradingAdvisor.firstFetchSince;

    if(this.exchange.providesHistory === 'date') {
      this.firstSince = moment.unix(this.firstSince).utc();
    }
  }

  this.batcher = new TradeBatcher(this.exchange.tid);

  this.pair = [
    config.watch.asset,
    config.watch.currency
  ].join('/');

  log.info('Starting to watch the market:',
    this.exchange.name,
    this.pair
  );

  // if the exchange returns an error
  // we will keep on retrying until next
  // scheduled fetch.
  this.tries = 0;
  this.limit = 20; // [TODO]

  this.firstFetch = true;

  this.batcher.on('new batch', this.relayTrades);
}

util.makeEventEmitter(Fetcher);

Fetcher.prototype._fetch = function(since) {
  if(++this.tries >= this.limit)
    return;

  this.watcher.getTrades(since, this.processTrades, false);
}

Fetcher.prototype.fetch = function() {
  var since = false;
  if(this.firstFetch) {
    since = this.firstSince;
    this.firstFetch = false;
  } else
    since = false;

  this.tries = 0;
  log.debug('Requested', this.pair, 'trade data from', this.exchange.name, '...');
  this._fetch(since);
}

Fetcher.prototype.processTrades = function(err, trades) {
  if(err || _.isEmpty(trades)) {
    if(err) {
      log.warn(this.exhange.name, 'returned an error while fetching trades:', err);
      log.debug('refetching...');
    } else
      log.debug('Trade fetch came back empty, refetching...');
    setTimeout(this._fetch, +moment.duration('s', 1));
    return;
  }
  this.batcher.write(trades);
}

Fetcher.prototype.relayTrades = function(batch) {
  this.emit('trades batch', batch);
}

module.exports = Fetcher;
