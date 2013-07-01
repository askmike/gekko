/*

  Gekko is a Bitcoin trading bot for Mt. Gox written 
  in node, it features multiple trading methods using 
  technical analysis.

  Disclaimer: 

  USE AT YOUR OWN RISK!

  The author of this project is NOT responsible for any damage or loss caused 
  by this software. There can be bugs and the bot may not perform as expected 
  or specified. Please consider testing it first without automatic buying / 
  selling in the provided advice. Also look at the code to see what how 
  it's working.

*/

// helpers
var moment = require('moment');
var _ = require('underscore');
var util = require('./util.js');
var log = require('./log.js');
var async = require('async');
var Manager = require('./portfolioManager');

var config = util.getConfig();
var Consultant = require('./methods/' + config.tradingMethod.toLowerCase().split(' ').join('-'));

log.info('I\'m gonna make you rich, Bud Fox.');
log.info('Let me show you some ' + config.tradingMethod + '.\n\n');

// if backtest is enabled do a minimal setup without
// traders, emailer, and exchange manager. Run it and
// quit.
if(config.backtest.enabled) {
  log.info('Preparing backtester to test strategy against historical data.');

  // implement a trading method to create a consultant.
  var consultant = new Consultant();

  // overwrite the watcher in case of normal setup
  if(config.normal.enabled)
    config.watch = config.normal;

  var Logger = require('./logger');
  var logger = new Logger(_.extend(config.profitCalculator, config.watch));

  consultant.on('advice', logger.inform);
  if(config.profitCalculator.enabled)
    consultant.on('advice', logger.trackProfits);

  consultant.on('finish', logger.finish);

  consultant.emit('prepare');
  return;
}

// setting up Gekko for moniting the live market.

//
// Normalize the configuration between normal & advanced.
// 
if(config.normal && config.normal.enabled) {
  // if the normal settings are enabled we overwrite the
  // watcher and traders set in the advanced zone
  log.info('Using normal settings to monitor the live market');
  config.watch = config.normal;
  config.traders = [];

  var checker = new Manager(config.normal, true);
  var valid = checker.validCredentials();
  if(config.normal.tradingEnabled && valid)
    config.traders.push( config.normal );
  else
    log.info('NOT trading with real money');
} else {
  log.info('Using advanced settings');
}

//
// Create a public exchange object which can retrieve live 
// trade information.
// 
var provider = config.watch.exchange.toLowerCase();
if(provider === 'btce') {
  // we can't fetch historical data from btce directly so we use bitcoincharts
  // @link http://bitcoincharts.com/about/markets-api/
  config.watch.market = provider;
  provider = 'bitcoincharts';
}
var DataProvider = require('./exchanges/' + provider);
var watcher = new DataProvider(config.watch);

// implement a trading method to create a consultant, we pass it a config and a 
// public mtgox object which the method can use to get data on past trades
var consultant = new Consultant(watcher);

// log advice
var Logger = require('./logger');
var logger = new Logger(_.extend(config.profitCalculator, config.watch));
consultant.on('advice', logger.inform);
if(config.profitCalculator.enabled)
  consultant.on('advice', logger.trackProfits);

//
// Configure automatic traders based on advice,
// after they are all prepared we continu.
// 
var managers = _.filter(config.traders, function(t) { return t.enabled });
var configureManagers = function(_next) {
  var next = _.after(managers.length, _next);
  _.each(managers, function(conf) {
    conf.exchange = conf.exchange.toLowerCase();

    var manager = new Manager(conf);
    consultant.on('advice', manager.trade);
    manager.on('ready', next);
  });
}


//
// Configure automatic email on advice.
//
var configureMail = function(next) {
  if(config.mail.enabled && config.mail.email) {
    var mailer = require('./mailer');
    mailer.init(function() {
      consultant.on('advice', mailer.send);
      next();
    });
  } else
    next();
}

var start = function() {
  consultant.emit('prepare');
}

async.series([configureMail, configureManagers], start);