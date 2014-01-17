// required indicators
var EMA = require('./EMA.js');

var Indicator = function(config) {
  this.result = false;
  this.short = new EMA(config.short);
  this.long = new EMA(config.long);
}

// add a price and calculate the EMAs and
// the diff for that price
Indicator.prototype.update = function(price) {
  this.short.update(price);
  this.long.update(price);
  this.calculateEMAdiff();
}

// @link https://github.com/virtimus/GoxTradingBot/blob/85a67d27b856949cf27440ae77a56d4a83e0bfbe/background.js#L145
Indicator.prototype.calculateEMAdiff = function() {
  var shortEMA = this.short.result;
  var longEMA = this.long.result;

  this.result = 100 * (shortEMA - longEMA) / ((shortEMA + longEMA) / 2);
}

module.exports = Indicator;
