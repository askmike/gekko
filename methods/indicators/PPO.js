// helpers
var _ = require('lodash');

// required indicators
var EMA = require('./EMA.js');

var Indicator = function(config) {
  this.macd = false;
  this.result = false;
  this.short = new EMA(config.short);
  this.long = new EMA(config.long);
  this.MACDsignal = new EMA(config.signal);
  this.PPOsignal = new EMA(config.signal);
}

Indicator.prototype.update = function(price) {
  this.short.update(price);
  this.long.update(price);
  this.calculatePPO();
  this.MACDsignal.update(this.macd);
  this.PPOsignal.update(this.result);
}

Indicator.prototype.calculatePPO = function() {
  var shortEMA = this.short.result;
  var longEMA = this.long.result;
  this.macd = shortEMA - longEMA;
  this.result = 100 * (this.macd / longEMA);
}

module.exports = Indicator;
