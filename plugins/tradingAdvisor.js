var util = require('../core/util');
var _ = require('lodash');

var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + '/log');
var CandleBatcher = require(dirs.core + 'candleBatcher');

var exchangeChecker = require(util.dirs().core + 'exchangeChecker');
var Reader = require(dirs.plugins + config.tradingAdvisor.adapter + '/reader');

var moment = require('moment');

var methods = [
  'MACD',
  'DEMA',
  'PPO',
  'RSI',
  'CCI',
  'custom'
];

var checkExchangeTrades = function(requiredHistory, next) {
  var provider = config.watch.exchange.toLowerCase();
  var DataProvider = require(util.dirs().gekko + 'exchanges/' + provider);

  // todo: move to gekko.js init
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

var Actor = function(done) {
  _.bindAll(this);

  this.batcher = new CandleBatcher(config.tradingAdvisor.candleSize);

  this.prepareHistoricalData(function() {

    var methodName = config.tradingAdvisor.method;

    if(!_.contains(methods, methodName))
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


    done();
  }.bind(this));

}

util.makeEventEmitter(Actor);

Actor.prototype.prepareHistoricalData = function(done) {
  // - step 1: check oldest trade reachable by API
  // - step 2: check most recent stored candle window
  // - step 3: see if overlap
  // - step 4: feed candle stream into CandleBatcher

  var requiredHistory = config.tradingAdvisor.candleSize * config.tradingAdvisor.historySize * 60;

  var reader = new Reader;

  // TODO: refactor cb hell
  checkExchangeTrades(requiredHistory, function(err, window) {
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
        'Exchange returns more data than we need, shift required history to',
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

    var exchangeTo = moment.unix(window.to).startOf('minute').unix();
    var exchangeFrom = moment.unix(window.from).add(1, 'm').startOf('minute').unix();
    var optimalFrom = exchangeTo - requiredHistory;

    reader.mostRecentWindow(exchangeFrom, optimalFrom, function(result) {
      if(!result) {
        log.debug('Unable to use locally stored candles.');
        return done();
      }

      // seed the batcher with locally stored historical candles
      log.debug('Using locally stored historical candles.');

      reader.get(result, exchangeFrom, function(rows) {
        this.batcher.write(rows);
        reader.close();
        done();

      }.bind(this));
    }.bind(this));
  }.bind(this));
}


// HANDLERS
// process the 1m candles
Actor.prototype.processCandle = function(candle) {
  this.batcher.write([candle]);
}

// propogate a custom sized candle to the trading method
Actor.prototype.processCustomCandle = function(candle) {
  this.method.tick(candle);
}

// EMITTERS
Actor.prototype.relayAdvice = function(advice) {
  this.emit('advice', advice);
}


module.exports = Actor;
