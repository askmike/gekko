// required indicators
var EMA = require('./EMA.js');

var Indicator = function(config) {
  this.input = 'price'
  this.result = false;
  this.inner = new EMA(config.weight);
  this.outer = new EMA(config.weight);
}

// add a price and calculate the EMAs and
// the result
Indicator.prototype.update = function(price) {
  this.inner.update(price);
  this.outer.update(this.inner.result);
  this.result = 2 * this.inner.result - this.outer.result;
}

module.exports = Indicator;
