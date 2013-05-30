/*

  Gekko is a Bitcoin trading bot for Mt. Gox written 
  in node, it features multiple trading methods using 
  technical analysis.

  Disclaimer: 

  USE AT YOUR OWN RISK!

  The authors of this project is NOT responsible for any damage or loss caused 
  by this software. There can be bugs and the bot may not perform as expected 
  or specified. Please consider testing it first without automatic buying / 
  selling in the provided advice. Also look at the code to see what how 
  it's working.

*/
var config = require('./config.js');

// helpers
var moment = require('moment');
var _ = require('underscore');
var util = require('./util.js');
var log = require('./log.js');
var async = require('async');

log.info('I\'m gonna make you rich, Bud Fox.');
log.info('Let me show you some ' + config.tradingMethod + '.');

// create a public exchange object which can retrieve trade information
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
var consultant = require('./methods/' + config.tradingMethod.toLowerCase().split(' ').join('-'));
consultant.emit('init', watcher, config.debug);

// log advice
var Logger = require('./logger');
var logger = new Logger(config.profitCalculator);
consultant.on('advice', logger.inform);
consultant.on('advice', logger.trackProfits);

// automatically trade
var configureManagers = function(_next) {
  var Manager = require('./portfolioManager');
  var managers = _.filter(config.traders, function(t) { return t.enabled });
  var next = _.after(managers.length, _next);
  _.each(managers, function(conf) {
    conf.exchange = conf.exchange.toLowerCase();

    var manager = new Manager(conf);
    consultant.on('advice', manager.trade);
    manager.on('ready', next);
  });
}

var configureMail = function(next) {
  if(config.mail.enabled && config.mail.email) {
    var mailer = require('./mailer');
    mailer.init(config.mail, function() {
      consultant.on('advice', mailer.send);
      next();
    });
  } else
    next();
}

var start = function() {
  consultant.emit('start');
}

async.series([configureMail, configureManagers], start);