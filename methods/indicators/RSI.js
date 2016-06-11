// required indicators
var EMA = require('./EMA.js');

var Indicator = function(weight) {
  this.lastClose = 0;
  this.weight = weight;
  this.weightEma = 2 * weight - 1;
  this.avgU = new EMA(this.weightEma);
  this.avgD = new EMA(this.weightEma);
  this.u = 0;
  this.d = 0;
  this.rs = 0;	
  this.rsi = 0;
  this.age = 0;
}

Indicator.prototype.update = function(candle) {
  var currentClose = candle.close;

  if(currentClose > this.lastClose) {
    this.u = currentClose - this.lastClose;
    this.d = 0;
  } else {
    this.u = 0;
    this.d = this.lastClose - currentClose;
  }

  this.avgU.update(this.u);
  this.avgD.update(this.d);
  this.rs = this.avgU.result / this.avgD.result;
  this.rsi = 100 - (100 / (1 + this.rs));

  this.age++;
  this.lastClose = currentClose;
}

module.exports = Indicator;
