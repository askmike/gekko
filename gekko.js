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

console.log('\nstart time: ', util.now());
console.log('\nI\'m gonna make you rich, Bud Fox.');
console.log('Let me show you some ' + config.tradingMethod + '.\n');

var MtGoxClient = require("mtgox-apiv2");
// create a public mtgox object which can retrieve 
// open trade information from the API
var publicMtgox = new MtGoxClient('~', '~');

// implement a trading method to create a consultant, we pass it a config and a 
// public mtgox object which the method can use to get data on past trades
var consultant = require('./methods/' + config.tradingMethod.toLowerCase().split(' ').join('-') + '.js');
consultant.emit('init', config.tradeConfig, publicMtgox, config.debug);

// whenever the consultant advices to sell or buy we can act on the information

var logger = require('./logger.js');
consultant.on('advice', logger.inform);
consultant.on('advice', logger.trackProfits);

var exchanges = ['MtGox', 'BTCe'];

_.each(config.traders, function(conf) {
  if(_.indexOf(exchanges, conf.exchange) === -1)
    throw 'unkown exchange';

  console.log(util.now(), 'real trading at', conf.exchange, 'ACTIVE');
  var Trader = require('./exchanges/' + conf.exchange.toLowerCase() + '.js');
  var trader = new Trader(conf.key, conf.secret);
  consultant.on('advice', trader.trade);
});

