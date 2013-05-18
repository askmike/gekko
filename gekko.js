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
var tradingMethod = 'Exponential Moving Averages';
var tradeConfig = {
  // timeframe per candle
  interval: 60, // in minutes
  // EMA weight (α)
  // the higher the weight, the more smooth
  // (and delayed) the line 
  shortEMA: 10,
  longEMA: 21,
  // amount of samples to remember
  // and base initial EMAs on
  candles: 20,
  // max difference between first and last
  // trade to base price calculation on
  sampleSize: 10, // in seconds
  // the difference between the EMAs (to 
  // act as triggers)
  sellTreshold: -0.25,
  buyTreshold: 0.25,
  debug: false // for additional logging
};

// helpers
var moment = require('moment');
var _ = require('underscore');
var util = require('./util.js');

console.log('\nstart time: ', util.now());
console.log('\nI\'m gonna make you rich, Bud Fox.');
console.log('Let me show you some ' + tradingMethod + '.\n');

var MtGoxClient = require("mtgox-apiv2");
// create a public mtgox object which can retrieve 
// open trade information from the API
var publicMtgox = new MtGoxClient('~', '~');

// implement a trading method to create a consultant, we pass it a config and a 
// public mtgox object which the method can use to get data on past trades
var consultant = require('./methods/' + tradingMethod.toLowerCase().split(' ').join('-') + '.js');
consultant.emit('init', tradeConfig, publicMtgox);

// whenever the consultant advices to sell or buy we can act on the information
var inform = function(what, meta) {
  console.log('(ADVICE)', util.now(), what, meta);
}
consultant.on('advice', inform);

//    DANGER ZONE
//    
// enable real trading BTC for real USD
// 
// fill in you public and private key from mtgox and uncomment to enable

/*
console.log(util.now(), 'real trading ACTIVE');
var publicKey = 'your public key';
var privateKey = 'your private key';
var mtgox = new MtGoxClient(publicKey, privateKey);

var act = function(what) {
  console.log(util.now(), 'NOW going to', what);
  if(what === 'BUY')
    mtgox.add('bid', 1000);
  if(what === 'SELL')
    mtgox.add('ask', 1000);
}
consultant.on('advice', act);
*/