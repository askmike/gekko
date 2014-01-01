/*

  Gekko is a Bitcoin trading bot for Mt. Gox written 
  in node, it features multiple trading methods using 
  technical analysis.

  Disclaimer:

  USE AT YOUR OWN RISK!

  The author of this project is NOT responsible for any damage or loss caused 
  by this software. There can be bugs and the bot may not perform as expected 
  or specified. Please consider testing it first with paper trading / 
  backtesting on historical data. Also look at the code to see what how 
  it's working.

*/

// helpers
var moment = require('moment');
var _ = require('lodash');
var util = require('./core/util');
var log = require('./core/log');
var async = require('async');
var Manager = require('./core/portfolioManager');
var exchangeChecker = require('./core/exchangeChecker');
var CandleManager = require('./core/candleManager');

var config = util.getConfig();

log.info('I\'m gonna make you rich, Bud Fox.', '\n\n');

//
// Normalize the configuration between normal & advanced.
// 
if(config.normal && config.normal.enabled) {
  // if the normal settings are enabled we overwrite the
  // watcher and traders set in the advanced zone
  config.watch = config.normal;
  config.traders = [];

  if(config.normal.tradingEnabled)
    config.traders.push( config.normal );
  else
    log.info('NOT trading with real money');
} else {
  log.info('Using advanced settings');
}

// make sure the monitoring exchange is configured correctly for monitoring
var invalid = exchangeChecker.cantMonitor(config.watch);
if(invalid)
  throw invalid;

// write config
util.setConfig(config);

var TradeAdvisor = require('./actors/tradeAdvisor');
var AdviceLogger = require('./actors/logger');

// currently we only support a single 
// market and a single advisor.
var market;
var advisor;

// instances will be spawned inside.
var marketActors = [];
var adviceActors = [];

// TODO: move this configurables into config somehow
var MarketActors = [
  AdviceLogger,
  TradeAdvisor
];

if(config.irc.enabled)
  MarketActors.push(require('./actors/ircbot'));

var AdviceActors = [];

// the names of actors who are both
// market Actors and adviceActors
var doubleActors = [
  'Advice logger',
  'IRC bot'
];
// END TODO



var setupMarket = function(next) {
  market = new CandleManager;
  next();
}

// async helper to spawn a bunch of either market or advice actors.
// 
// type: string name of type.
// classes: an array of constructor functions from which to spawn advisors
// instances: array to fill with instances of those constructors.
// readyInstances: array with ready instances to append to the instances
// done: callback
var setupActors = function(type, classes, instances, readyInstances, done) {
  async.each(
    classes,
    function iterator(Actor, next) {
      var actor = new Actor(util.defer(next));

      if(actor.name && actor.description) {
        console.log();
        log.info('Seting up a new', type ,'actor:');
        log.info('\t', actor.name);
        log.info('\t', actor.description);
        console.log();
      }

      instances.push(actor);
    },
    function() {
      _.each(readyInstances, function(instance) {
        instances.push(instance);
      });

      // set global reference to the advisor
      var _advisor = _.find(instances, function(instance) {
        return instance.name && instance.name === 'Trade advisor';
      });

      if(_advisor)
        advisor = _advisor;

      done();
    }
  );
};


var setupMarketActors = function(next) {

  var done = function() {
    _.each(marketActors, function(actor) {
      if(actor.init)
        // when we have enough history available for a market actor
        market.on('prepared', actor.init);

      if(actor.processCandle)
        // relay new candles to every market actor
        market.on('candle', actor.processCandle);
    });

    next();
  }

  setupActors('market', MarketActors, marketActors, [], done);
}

var setupAdviceActors = function(next) {
  var done = function() {

    _.each(adviceActors, function(actor) {
      // relay all new advice to everyone interested
      advisor.method.on('advice', util.defer(actor.processAdvice));
    });
    
    next();
  }

  var ready = [];
  _.each(doubleActors, function(name) {
    ready = _.filter(marketActors, function(actor) {
      return actor.name && actor.name === name;
    });
  });

  setupActors('advice', AdviceActors, adviceActors, ready, done);
}

async.series(
  [
    setupMarket,
    setupMarketActors,
    setupAdviceActors
  ],
  function() {

    // done!

  }
);