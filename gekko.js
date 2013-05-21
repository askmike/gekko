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
var watcher = new DataProvider(market, config.watch.currency, config);

// implement a trading method to create a consultant, we pass it a config and a 
// public mtgox object which the method can use to get data on past trades
var consultant = require('./methods/' + config.tradingMethod.toLowerCase().split(' ').join('-') + '.js');
consultant.emit('init', config.EMA, watcher, config.debug);

// whenever the consultant advices to sell or buy we can act on the information

// log advice
var logger = require('./logger.js');
consultant.on('advice', logger.inform);
consultant.on('advice', logger.trackProfits);

// mail advice
if(config.mail.enabled && config.mail.email) {
  // ask for the mail password
  var prompt = require('prompt-lite');
  prompt.start();
  console.log('You configured Gekko to mail you advice, Gekko needs your email password to send emails (to you).');
  console.log([
    'Gekko is an opensource project < http://github.com/askmike/gekko >, ', 
    'you can take my word but always check the code yourself.',
    '\n\n\tWARNING: If you have not downloaded Gekko from the github page above we ',
    'CANNOT garantuee that your email address & password are safe.\n',
    '\tWARNING: If you have not downloaded Gekko from the github page above we ',
    'CANNOT garantuee that your email address & password are safe!\n'
  ].join(''));
  prompt.get({name: 'password', hidden: true}, function(err, result) {
    var mailer = require('./mailer.js');
    config.mail.password = result.password;
    mailer.init(config.mail);
    consultant.on('advice', mailer.send);
  });  
}

var exchanges = ['mtgox', 'btce'];

_.each(config.traders, function(conf) {
  if(!conf.enabled)
    return;

  if(!conf.key || !conf.secret)
    throw 'missing key or secret!';

  if(_.indexOf(exchanges, conf.exchange.toLowerCase()) === -1)
    throw 'unkown exchange';

  console.log(util.now(), 'real trading at', conf.exchange, 'ACTIVE');
  var Trader = require('./exchanges/' + conf.exchange.toLowerCase() + '.js');
  var trader = new Trader(conf);
  consultant.on('advice', trader.trade);
});

