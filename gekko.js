/*

  Gekko is a Bitcoin trading bot for popular Bitcoin exchanges written 
  in node, it features multiple trading methods using technical analysis.

  Disclaimer:

  USE AT YOUR OWN RISK!

  The author of this project is NOT responsible for any damage or loss caused 
  by this software. There can be bugs and the bot may not perform as expected 
  or specified. Please consider testing it first with paper trading / 
  backtesting on historical data. Also look at the code to see what how 
  it's working.

*/

var coreDir = './core/';
var actorsDir = './actors/';

var moment = require('moment');
var _ = require('lodash');
var async = require('async');

var util = require(coreDir + 'util');
var log = require(coreDir + 'log');

log.info('I\'m gonna make you rich, Bud Fox.', '\n\n');

//
// Normalize the configuration between normal & advanced.
// 
var config = util.getConfig();
if(config.normal && config.normal.enabled) {
  // if the normal settings are enabled we overwrite the
  // watcher and traders set in the advanced zone
  config.watch = config.normal;
  config.traders = [];

  if(config.normal.tradingEnabled)
    config.traders.push(config.normal);
}

var gekkoMode = 'realtime';

// write config
util.setConfig(config);

var exchangeChecker = require(coreDir + 'exchangeChecker');
// make sure the monitoring exchange is configured correctly for monitoring
var invalid = exchangeChecker.cantMonitor(config.watch);
if(invalid)
  throw invalid;

// currently we only support a single 
// market and a single advisor.
var market;
var advisor;
var actors = [];

var setupMarket = function(next) {
  var Market = require(coreDir + 'candleManager');
  market = new Market;
  next();
}

// load each actor
var loadActors = function(next) {
  var actorSettings = require('./actors');

  var iterator = function(actor, next) {
    var actorConfig = config[actor.slug];

    // only load actors that are supported by
    // Gekko's current mode
    if(!_.contains(actor.modes, gekkoMode))
      return next();

    // if the actor is disabled skip as well
    if(!actorConfig.enabled)
      return next();

    var Actor = require(actorsDir + actor.slug);

    if(!actor.silent) {
      console.log();
      log.info('Setting up:');
      log.info('\t', actor.name);
      log.info('\t', actor.description);
      console.log();
    }

    if(actor.async) {
      var instance = new Actor(util.defer(next));

      instance.meta = actor;
      actors.push(instance);

    } else {
      var instance = new Actor;

      instance.meta = actor;
      actors.push(instance);

      _.defer(next);
    }
  }

  async.eachSeries(
    actorSettings,
    iterator,
    next
  );
};

// advisor is a special actor in that it spawns an
// advice feed. Which everyone can subscribe to.
var setupAdvisor = function(next) {

  var settings;

  var actor = _.find(actors, function(advisor) {
    if(!advisor.meta.originates)
      return false;

    settings = _.find(
      advisor.meta.originates,
      function(o) {
        return o.feed === 'advice feed'
      }
    );
    return settings;
  });

  advisor = actor[settings.object];

  next();
}

var watchFeeds = function(next) {
  _.each(actors, function(actor) {
    var subscriptions = actor.meta.subscriptions;

    if(_.contains(subscriptions, 'market feed')) {

      if(actor.processCandle)
        market.on('candle', actor.processCandle);
      if(actor.processSmallCandle)
        market.on('small candle', actor.processSmallCandle);
      if(actor.processTrade)
        market.on('trade', actor.processTrade);
      if(actor.init)
        market.on('history', actor.init);
    }

    if(_.contains(subscriptions, 'advice feed')) {

      if(actor.processAdvice)
        advisor.on('advice', actor.processAdvice);
      
    }
  });

  next();
}

log.info('Setting up Gekko in', gekkoMode, 'mode');

async.series(
  [
    loadActors,
    setupAdvisor,
    setupMarket,
    watchFeeds
  ],
  function() {
    // everything is setup!
    market.start();
  }
);