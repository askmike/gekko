var util = require('../core/util');
var _ = require('lodash');
var fs = require('fs');

var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + '/log');
var CandleBatcher = require(dirs.core + 'candleBatcher');

var moment = require('moment');

var Actor = function(done) {
  _.bindAll(this);

  this.done = done;

  this.batcher = new CandleBatcher(config.tradingAdvisor.candleSize);

  var mode = util.gekkoMode();

  if(mode === 'realtime')
    this.prepareHistoricalData(this.init);
  else if(mode === 'backtest')
    this.init();
}

util.makeEventEmitter(Actor);

Actor.prototype.init = function(done) {
  var methodName = config.tradingAdvisor.method;

  if(!fs.existsSync(dirs.methods + methodName + '.js'))
    util.die('Gekko doesn\'t know the method ' + methodName);

  log.info('\t', 'Using the trading method: ' + methodName);

  var method = require(dirs.methods + methodName);

  // bind all trading method specific functions
  // to the Consultant.
  var Consultant = require(dirs.core + 'baseTradingMethod');

  _.each(method, function(fn, name) {
    Consultant.prototype[name] = fn;
  });

  this.method = new Consultant;

  this.batcher
    .on('candle', this.processCustomCandle)

  this.method
    .on('advice', this.relayAdvice);

  this.done();
}

Actor.prototype.prepareHistoricalData = function(done) {
  // - step 1: check oldest trade reachable by API
  // - step 2: check most recent stored candle window
  // - step 3: see if overlap
  // - step 4: feed candle stream into CandleBatcher

  if(config.tradingAdvisor.historySize === 0)
    return done();

  var requiredHistory = config.tradingAdvisor.candleSize * config.tradingAdvisor.historySize * 60;
  var Reader = require(dirs.plugins + config.tradingAdvisor.adapter + '/reader');

  var reader = new Reader;

  log.debug(
    'The trading method requests',
    requiredHistory,
    'seconds of historic data. Checking availablity..'
  );

  // TODO: refactor cb hell
  this.checkExchangeTrades(requiredHistory, function(err, window) {
    log.debug(
      'Exchange has data spanning',
      window.to - window.from,
      'seconds, we need at least',
      requiredHistory,
      'seconds.'
    );

    if(window.to - window.from > requiredHistory) {
      // calc new required history
      var dif = window.to - window.from;
      requiredHistory = Math.floor(dif / 60 / config.tradingAdvisor.candleSize);

      log.debug(
        'Exchange returns more data than we need,',
        'shift required history to',
        requiredHistory,
        '.'
      );

      util.setConfigProperty(
        'tradingAdvisor',
        'historySize',
        requiredHistory
      );

      return done();
    }

    // We need more data

    var exchangeTo = moment.unix(window.to).startOf('minute').unix();
    var exchangeFrom = moment.unix(window.from).subtract(1, 'm').startOf('minute').unix();
    var optimalFrom = exchangeTo - requiredHistory;

    reader.mostRecentWindow(exchangeFrom, optimalFrom, function(result) {
      if(!result) {
        log.info(
          '\t',
          'Unable to seed the trading method',
          'with locally stored historical candles',
          '(Gekko needs more time before it can give advice).'
        );
        return done();
      }

      if(result === optimalFrom) {
        log.debug(
          'Full history locally available.',
          'Seeding the trading method with all required historical candles.'
        );
      } else {
        log.debug(
          'Partial history locally available. But',
          result - optimalFrom,
          'seconds are missing. Seeding the trading method with',
          'partial historical data (Gekko needs more time before',
          'it can give advice).'
        );
      }

      reader.get(result, exchangeFrom, function(rows) {
        // todo: do this in proper place

        rows = rows.map(row => {
          row.start = moment.unix(row.start);
          return row;
        });

        this.batcher.write(rows);
        reader.close();
        done();

      }.bind(this));
    }.bind(this));
  }.bind(this));
}

Actor.prototype.checkExchangeTrades = function(requiredHistory, next) {
  var provider = config.watch.exchange.toLowerCase();
  var DataProvider = require(util.dirs().gekko + 'exchanges/' + provider);

  var exchangeChecker = require(util.dirs().core + 'exchangeChecker');
  var exchangeSettings = exchangeChecker.settings(config.watch)

  var watcher = new DataProvider(config.watch);

  if(exchangeSettings.maxHistoryFetch)
    var since = exchangeSettings.maxHistoryFetch;
  else if(exchangeSettings.providesHistory === 'date')
    // NOTE: uses current time
    var since = moment()
      .subtract(requiredHistory, 'seconds')
      .subtract(config.tradingAdvisor.candleSize, 'minutes');
  else if(exchangeSettings.providesHistory)
    // NOTE: specific to btc-e atm
    var since = exchangeSettings.providesHistory;

  util.setConfigProperty(
    'tradingAdvisor',
    'firstFetchSince',
    since
  );

  watcher.getTrades(since, function(e, d) {
    if(_.isEmpty(d))
      return util.die(
        `Gekko tried to retrieve data since ${since.format('YYYY-MM-DD HH:mm:ss')}, however
        ${provider} did not return any trades. Try to raise the tradingAdviser.historySize.`
      );

    next(e, {
      from: _.first(d).date,
      to: _.last(d).date
    })
  });
}

// HANDLERS
// process the 1m candles
Actor.prototype.processCandle = function(candle, done) {
  this.batcher.write([candle]);
  done();
}

// propogate a custom sized candle to the trading method
Actor.prototype.processCustomCandle = function(candle) {
  this.method.tick(candle);
}

// pass through shutdown handler
Actor.prototype.finish = function(done) {
  this.method.finish(done);
}

// EMITTERS
Actor.prototype.relayAdvice = function(advice) {
  this.emit('advice', advice);
}


module.exports = Actor;
