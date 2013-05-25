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

log.info('I\'m gonna make you rich, Bud Fox.');
log.info('Let me show you some ' + config.tradingMethod + '.');

// create a public exchange object which can retrieve trade information
var provider = config.watch.exchange.toLowerCase();
if(provider === 'btce') {
  if(!config.watch.currency)
    throw 'need to set watcher currency';
  // we can't fetch historical data from btce directly so we use bitcoincharts
  // @link http://bitcoincharts.com/about/markets-api/
  var market = provider;
  provider = 'bitcoincharts';
}
var DataProvider = require('./exchanges/' + provider + '.js');
var watcher = new DataProvider(market, config.watch.currency);

// implement a trading method to create a consultant, we pass it a config and a 
// public mtgox object which the method can use to get data on past trades
var consultant = require('./methods/' + config.tradingMethod.toLowerCase().split(' ').join('-') + '.js');
consultant.emit('init', watcher, config.debug);

// whenever the consultant advices to sell or buy we can act on the information

// log advice
var Logger = require('./logger.js');
var logger = new Logger(config.profitCalculator);
consultant.on('advice', logger.inform);
consultant.on('advice', logger.trackProfits);

// automatically trade
var exchanges = ['mtgox', 'btce', 'bitstamp'];
_.each(config.traders, function(conf) {
  if(!conf.enabled)
    return;

  conf.exchange = conf.exchange.toLowerCase()

  if(_.indexOf(exchanges, conf.exchange) === -1)
    throw 'unkown exchange';

  if(conf.exchange === 'bitstamp') {
    if(!conf.user || !conf.password)
      throw 'missing user or password!';
  } else {
    if(!conf.key || !conf.secret)
      throw 'missing key or secret!';
  }

  log.info('real trading at', conf.exchange, 'ACTIVE');
  var Trader = require('./exchanges/' + conf.exchange.toLowerCase() + '.js');
  var trader = new Trader(conf);
  consultant.on('advice', trader.trade);
});

// mail advice
if(config.mail.enabled && config.mail.email) {
  var mailer = require('./mailer.js');
  mailer.init(config.mail, function() {
    consultant.emit('start');
    consultant.on('advice', mailer.send);
  });
} else 
  consultant.emit('start');