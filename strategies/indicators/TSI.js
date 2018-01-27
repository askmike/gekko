// required indicators
var EMA = require('./EMA.js');

var Indicator = function(settings) {
  this.input = 'candle';
  this.lastClose = null;
  this.tsi = 0;
  this.inner = new EMA(settings.long);
  this.outer = new EMA(settings.short);
  this.absoluteInner = new EMA(settings.long);
  this.absoluteOuter = new EMA(settings.short);
}

Indicator.prototype.update = function(candle) {
  var close = candle.close;
  var prevClose = this.lastClose;
  
  if (prevClose === null) {
    // Set initial price to prevent invalid change calculation
    this.lastClose = close;
    // Do not calculate TSI on first close
    return;
  }
  
  var momentum = close - prevClose;

  this.inner.update(momentum);
  this.outer.update(this.inner.result);

  this.absoluteInner.update(Math.abs(momentum));
  this.absoluteOuter.update(this.absoluteInner.result);

  this.tsi = 100 * this.outer.result / this.absoluteOuter.result;

  this.lastClose = close;
}

module.exports = Indicator;
