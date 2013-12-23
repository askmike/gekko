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

  // console.log(config);
  log.info('Starting to watch the market:',
    this.exchange.name,
    [
      config.watch.currency,
      config.watch.asset
    ].join('/')
  );

  this.start();

  if(!this.exchange.providesHistory) {
    this.on('new trades', function(a) {
      log.debug(
        'Fetched',
        _.size(a.all),
        'new trades, from',
        a.start.format('HH:mm:ss (UTC)'),
        'to',
        a.end.format('HH:mm:ss (UTC)')
      );
    });  
  }
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.start = function() {
  // if this exchange does not support historical trades
  // start fetching.
  if(!this.exchange.providesHistory)
    this.fetch(false);
  else
    console.log(
      'either start looping right away (`since`)',
      'or first determine starting point dynamically'
    );
}

// Set the first & last trade date and set the
// timespan between them.
Fetcher.prototype.setFetchMeta = function(trades) {
  var first = _.first(trades); 
  this.first = moment.unix(first.date).utc();
  var last = _.last(trades);
  this.last = moment.unix(last.date).utc();

  this.fetchTimespan = util.calculateTimespan(this.first, this.last);
}

// *This method is only used if this exchange does not support
// historical data.*
// 
// we need to keep polling exchange because we cannot
// access older data. We need to calculate how often we
// we should poll.
// 
// Returns amount of ms to wait for until next fetch.
Fetcher.prototype.calculateNextFetch = function(trades) {
  // if the timespan per fetch is fixed at this exchange,
  // just return that number.
  if(this.exchange.fetchTimespan)
    return util.msToMin(this.exchange.fetchTimespan);

  var minimalInterval = util.minToMs(config.EMA.interval);

  // if we got the last 150 seconds of trades last
  // time make sure we fetch at least in 100 seconds
  // again.
  var safeTreshold = 1.5;
  var defaultFetchTime = util.minToMs(1);

  if(this.fetchTimespan / safeTreshold > minimalInterval)
    // If the oldest trade in a fetch call > ema.interval
    // we can just use ema.interval.
    var fetchAfter = minimalInterval;
  else if(this.fetchTimespan / safeTreshold > defaultFetchTime)
    // If the oldest trade in a fetch call > default time
    // we fetch at default time.
    var fetchAfter = defaultFetchTime;
  else
    // if we didn't even get enough trades for 1 minute
    // fetch aggresively.
    var fetchAfter = this.fetchTimespan / safeTreshold;

  log.debug('Scheduling next fetch: in', util.msToMin(fetchAfter), 'minutes');
  this.fetchAfter = fetchAfter;
}

Fetcher.prototype.scheduleNextFetch = function() {
  setTimeout(this.fetch, this.fetchAfter);
}

Fetcher.prototype.fetch = function(since) {
  this.watcher.getTrades(since, this.processTrades, false);
}

Fetcher.prototype.processTrades = function(err, trades) {
  if(err)
    throw err;

  this.setFetchMeta(trades);

  this.calculateNextFetch();
  // schedule next fetch
  if(!this.exchange.providesHistory)
    this.scheduleNextFetch();
  else
    console.log('wup wup refetching NOW because this exchange supports it');

  this.emit('new trades', {
    start: this.first,
    end: this.last,
    all: trades,
    nextIn: this.fetchAfter
  });
}


module.exports = Fetcher;