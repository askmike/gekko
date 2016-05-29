var util = require('../core/util');
var _ = require('lodash');

var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + '/log');
var CandleBatcher = require(dirs.core + 'candleBatcher');

var Reader = require(dirs.plugins + config.tradingAdvisor.adapter + '/reader');

var moment = require('moment');

var methods = [
  'MACD',
  'DEMA',
  'PPO',
  'RSI',
  'custom'
];

var checkExchangeTrades = function(next) {
  var provider = config.watch.exchange.toLowerCase();
  var DataProvider = require(util.dirs().gekko + 'exchanges/' + provider);

  var watcher = new DataProvider(config.watch);
  watcher.getTrades(null, function(e, d) {
    next(e, {
      from: _.first(d).date,
      to: _.last(d).date
    })
  });
}


// var targetHistoryTo = moment().unix();
// var targetHistoryFrom = targetHistoryTo - config.tradingAdvisor.candleSize * config.tradingAdvisor.historySize;


var Actor = function(done) {
  _.bindAll(this);

  this.batcher = new CandleBatcher(config.tradingAdvisor.candleSize);

  // - step 1: check oldest trade reachable by API
  // - step 2: check most recent stored candle window
  // - step 3: see if overlap
  // - step 4: feed candle stream into CandleBatcher

  var requiredHistory = config.tradingAdvisor.candleSize * config.tradingAdvisor.historySize * 60;

  var reader = new Reader;

  // TODO: refactor cb hell
  checkExchangeTrades(function(err, window) {
    log.debug(
      'Exchange has data spanning',
      window.to - window.from,
      'seconds, we need at least',
      requiredHistory,
      'seconds.'
    );


    if(window.to - window.from > requiredHistory) {
      log.debug('Solely relying on historical data from exchange.');
      // all required historical data is send by the exchange.
      return done();
    }

    // preferably we have locally stored candles
    var exchangeTo = moment.unix(window.to).startOf('minute').unix();
    var exchangeFrom = moment.unix(window.from).add(1, 'm').startOf('minute').unix();
    var optimalFrom = exchangeTo - (requiredHistory * 60);

    reader.mostRecentWindow(exchangeFrom, optimalFrom, function(result) {
      if(!result) {
        log.debug('Unable to use locally stored data.');
        return done();
      }

      // seed the batcher with locally stored historical data
      log.debug('Using locally stored historical data.');
      reader.get(result, exchangeFrom, function(rows) {
        this.batcher.write(rows);
        reader.close();
        done();
      }.bind(this));
    }.bind(this));
  }.bind(this));


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

  // next();
}

util.makeEventEmitter(Actor);

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
