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
var util = require('./util');
var log = require('./log');
var async = require('async');
var Manager = require('./portfolioManager');

var config = util.getConfig();

// overwrite the watcher in case of normal setup
if(config.normal.enabled)
	config.watch = config.normal;
// set backtesting reminder
config.backtest.enabled = true;

// set updated config
util.setConfig(config);

var Consultant = require('./methods/' + config.tradingMethod.toLowerCase().split(' ').join('-'));

log.info('I\'m gonna make you rich, Bud Fox.');
log.info('Let me show you some ' + config.tradingMethod + '.\n\n');

log.info('Preparing backtester to test strategy against historical data.');

// implement a trading method to create a consultant.
var consultant = new Consultant();



var Logger = require('./logger');
var logger = new Logger(_.extend(config.profitCalculator, config.watch));

consultant.on('advice', logger.inform);
if(config.profitCalculator.enabled)
	consultant.on('advice', logger.trackProfits);

consultant.on('finish', logger.finish);

consultant.emit('prepare');