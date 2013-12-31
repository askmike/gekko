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

var TradeAdvisor = require('./actors/price/tradeAdvisor');
var AdviceLogger = require('./actors/advice/logger');

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

var adviceLogger = new AdviceLogger;
var tradeAvisor = new TradeAdvisor;
var candleManager = new CandleManager;

console.log();
log.info('Seting up a new price actor:');
log.info('\t', tradeAvisor.name);
log.info('\t', tradeAvisor.description);
console.log();

var marketActors = [
  adviceLogger,
  tradeAvisor
  // todo: add more market actors, like:
  //  - price monitoring tool
  //  - price charting module
  //  - volume monitoring module
];

_.each(marketActors, function(actor) {
  if(actor.init)
    // when we have enough history available for a market actor
    candleManager.on('prepared', actor.init);

  if(actor.processCandle)
    // relay new candles to every market actor
    candleManager.on('candle', actor.processCandle);
});

var adviceActors = [
  adviceLogger
  // todo: add advice actors like
  //  - mailer
  //  - auto trader
  //  - profit simulator
];

_.each(adviceActors, function(actor) {
  // relay all new advice to everyone interested
  tradeAvisor.method.on('advice', util.defer(actor.processAdvice));
});

