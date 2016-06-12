// If you want to use your own trading methods you can
// write them here. For more information on everything you
// can use please refer to this document:
// 
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md
// 
// The example below is pretty stupid: on every new candle there is
// a 10% chance it will recommand to change your position (to either
// long or short).

var config = require('../core/util.js').getConfig();
var settings = config['talib-macd'];

// Let's create our own method
var method = {};

// Prepare everything our method needs
method.init = function() {
  this.name = 'talib-macd'
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = config.tradingAdvisor.historySize;

  var customMACDSettings = settings.parameters;

  // define the indicators we need
  this.addTalibIndicator('macd', 'macd', customMACDSettings);
}

// What happens on every new candle?
method.update = function(candle) {
  // nothing!
}


method.log = function() {
  
}

// Based on the newly calculated
// information, check if we should
// update or not.
method.check = function() {
  var price = this.lastPrice;
  var result = this.talibIndicators.macd.result;
  var macddiff = result['outMACD'] - result['outMACDSignal'];

  if(settings.thresholds.down > macddiff && this.currentTrend !== 'short') {
    this.currentTrend = 'short';
    this.advice('short');

  } else if(settings.thresholds.up < macddiff && this.currentTrend !== 'long'){
    this.currentTrend = 'long';
    this.advice('long');

  }
}

module.exports = method;