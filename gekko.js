/*

  Gekko is a Bitcoin trading bot for Mt. Gox written 
  in node, it will feature multiple trading methods using 
  technical analysis.

  Disclaimer: 

  USE AT YOUR OWN RISK!

  The authors of this project is NOT responsible for any damage or loss caused 
  by this software. There can be bugs and the bot may not perform as expected 
  or specified. Please consider testing it first with a small amount of funds, 
  and check to the code to see what how it's working.

*/
var tradingMethod = 'Exponential Moving Averages';

var MtGoxClient = require("mtgox-apiv2");

// create a public mtgox object which can retrieve 
// open trade information from the API.
var publicMtgox = new MtGoxClient('~', '~');

// helpers
var moment = require('moment');
var _ = require('underscore');
var util = require('./util.js');

var config = {
  interval: 60, // in minutes
  shortEMA: 10,
  longEMA: 21,
  candles: 12,
  sampleSize: 0.005 // in minutes
}

// implement a trading method to create a consultant, we pass it a config and a 
// public mtgox object which the method can use to get data on past trades..
var consultant = require('./methods/' + tradingMethod.toLowerCase().split(' ').join('-') + '.js');
consultant.emit('init', config, publicMtgox);

// whenever the consultant advices to sell or buy we can act on the information
consultant.on('advice', console.log);