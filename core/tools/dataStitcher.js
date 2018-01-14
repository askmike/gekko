var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');

var util = require('../../core/util');
var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + '/log');

var Stitcher = function(batcher) {
  this.batcher = batcher;
}

Stitcher.prototype.ago = function(ts) {
  var now = moment().utc();
  var then = moment.unix(ts).utc();
  return now.diff(then, 'minutes') + ' minutes ago';
}

Stitcher.prototype.verifyExchange = function() {
  var exchangeChecker = require(dirs.core + 'exchangeChecker');
  var slug = config.watch.exchange.toLowerCase();
  var exchange = exchangeChecker.getExchangeCapabilities(slug);

  if(!exchange)
    util.die(`Unsupported exchange: ${slug}`);

  var error = exchangeChecker.cantMonitor(config.watch);
  if(error)
    util.die(error, true);
}

Stitcher.prototype.prepareHistoricalData = function(done) {
  this.verifyExchange();

  // - step 1: check most recent stored candle window
  // - step 2: check oldest trade reachable by API
  // - step 3: see if overlap
  // - step 4: feed candle stream into CandleBatcher

  if(config.tradingAdvisor.historySize === 0)
    return done();

  var requiredHistory = config.tradingAdvisor.candleSize * config.tradingAdvisor.historySize;
  var Reader = require(dirs.plugins + config.adapter + '/reader');

  this.reader = new Reader;

  log.info(
    '\tThe trading method requests',
    requiredHistory,
    'minutes of historic data. Checking availablity..'
  );

  var endTime = moment().utc().startOf('minute');
  var idealStartTime = endTime.clone().subtract(requiredHistory, 'm');

  this.reader.mostRecentWindow(idealStartTime, endTime, function(localData) {
    // now we know what data is locally available, what
    // data would we need from the exchange?
    if(!localData) {
      log.info('\tNo usable local data available, trying to get as much as possible from the exchange..');
      var idealExchangeStartTime = idealStartTime.clone();
      var idealExchangeStartTimeTS = idealExchangeStartTime.unix();
    }
    else {
      log.debug('\tAvailable local data:');
      log.debug('\t\tfrom:', this.ago(localData.from));
      log.debug('\t\tto:', this.ago(localData.to));

      log.info('\tUsable local data available, trying to match with exchange data..')
      // local data is available, we need the next minute


      // make sure we grab back in history far enough
      var secondsOverlap = 60 * 15; // 15 minutes
      var idealExchangeStartTimeTS = localData.to - secondsOverlap;
      var idealExchangeStartTime = moment.unix(idealExchangeStartTimeTS).utc();

      // already set the
      util.setConfigProperty(
        'tradingAdvisor',
        'firstFetchSince',
        idealExchangeStartTimeTS
      );
    }

    // Limit the history Gekko can try to get from the exchange.
    var minutesAgo = endTime.diff(idealExchangeStartTime, 'minutes');
    var maxMinutesAgo = 4 * 60; // 4 hours
    if(minutesAgo > maxMinutesAgo) {
      log.info('\tPreventing Gekko from requesting', minutesAgo, 'minutes of history.');
      idealExchangeStartTime = endTime.clone().subtract(maxMinutesAgo, 'minutes');
      idealExchangeStartTimeTS = idealExchangeStartTime.unix();
    }

    log.debug('\tFetching exchange data since', this.ago(idealExchangeStartTimeTS))
    this.checkExchangeTrades(idealExchangeStartTime, function(err, exchangeData) {
      log.debug('\tAvailable exchange data:');
      log.debug('\t\tfrom:', this.ago(exchangeData.from));
      log.debug('\t\tto:', this.ago(exchangeData.to));

      // in case we have limited local data, and the
      // exchange would offer more than we have: ignore
      // the local data..
      if(
        localData &&
        exchangeData &&
        exchangeData.from < localData.from
      ) {
        log.debug('\tExchange offered more data than locally available. Ignoring local data');
        localData = false;
      }

      var stitchable = localData && exchangeData.from <= localData.to;
      if(stitchable) {
        log.debug('\tStitching datasets');

        // we can combine local data with exchange data
        if(idealStartTime.unix() >= localData.from) {
          log.info(
            '\tFull history locally available.',
            'Seeding the trading method with all required historical candles.'
          );

        } else {

          // stitchable but not enough

          log.info(
            '\tPartial history locally available, but',
            Math.round((localData.from - idealStartTime.unix()) / 60),
            'minutes are missing.')
          log.info('\tSeeding the trading method with',
            'partial historical data (Gekko needs more time before',
            'it can give advice).'
          );
        }

        // seed all historic data up to the point the exchange can provide.
        var from = localData.from;
        var to = moment.unix(exchangeData.from).utc()
          .startOf('minute')
          .subtract(1, 'minute')
          .unix();

        log.debug('\tSeeding with:');
        log.debug('\t\tfrom:', this.ago(from));
        log.debug('\t\tto:', this.ago(to));
        return this.seedLocalData(from, to, done);

      } else if(!stitchable) {
        log.debug('\tUnable to stitch datasets.')
        // we cannot use any local data..
        log.info(
          '\tNot seeding locally available data to the trading method.'
        );

        if(exchangeData.from < idealExchangeStartTimeTS) {
          log.info('\tHowever the exchange returned enough data anyway!');
        } else if(localData) {
          log.info(
            '\tThe exchange does not return enough data.',
            Math.round((localData.from - idealStartTime.unix()) / 60),
            'minutes are still missing.'
          );
        }
      }

      done();

    }.bind(this));
  }.bind(this));
}

Stitcher.prototype.checkExchangeTrades = function(since, next) {
  var provider = config.watch.exchange.toLowerCase();
  var DataProvider = require(util.dirs().gekko + 'exchanges/' + provider);

  var exchangeConfig = config.watch;

  // include trader config if trading is enabled
  if (_.isObject(config.trader) && config.trader.enabled) {
    exchangeConfig = _.extend(config.watch, config.trader);
  }

  var watcher = new DataProvider(exchangeConfig);

  watcher.getTrades(since, function(e, d) {
    if(_.isEmpty(d))
      return util.die(
        `Gekko tried to retrieve data since ${since.format('YYYY-MM-DD HH:mm:ss')}, however
        ${provider} did not return any trades.`
      );

    next(e, {
      from: _.first(d).date,
      to: _.last(d).date
    })
  });
}

Stitcher.prototype.seedLocalData = function(from, to, next) {
  this.reader.get(from, to, 'full', function(err, rows) {
    rows = _.map(rows, row => {
      row.start = moment.unix(row.start);
      return row;
    });

    this.batcher.write(rows);
    this.reader.close();
    next();

  }.bind(this));
}

module.exports = Stitcher;
