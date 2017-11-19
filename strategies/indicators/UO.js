// required indicators
var SMA = require('./SMA.js');

var Indicator = function(settings) {
  this.input = 'candle';
  this.lastClose = 0;
  this.uo = 0;
  this.firstWeight = settings.first.weight;
  this.secondWeight = settings.second.weight;
  this.thirdWeight = settings.third.weight;
  this.firstLow = new SMA(settings.first.period);
  this.firstHigh = new SMA(settings.first.period);
  this.secondLow = new SMA(settings.second.period);
  this.secondHigh = new SMA(settings.second.period);
  this.thirdLow = new SMA(settings.third.period);
  this.thirdHigh = new SMA(settings.third.period);
}

Indicator.prototype.update = function(candle) {
  var close = candle.close;
  var prevClose = this.lastClose;
  var low = candle.low;
  var high = candle.high;

  var bp = close - Math.min(low, prevClose);
  var tr = Math.max(high, prevClose) - Math.min(low, prevClose);

  this.firstLow.update(tr);
  this.secondLow.update(tr);
  this.thirdLow.update(tr);

  this.firstHigh.update(bp);
  this.secondHigh.update(bp);
  this.thirdHigh.update(bp);

  var first = this.firstHigh.result / this.firstLow.result;
  var second = this.secondHigh.result / this.secondLow.result;
  var third = this.thirdHigh.result / this.secondLow.result;

  this.uo = 100 * (this.firstWeight * first + this.secondWeight * second + this.thirdWeight * third) / (this.firstWeight + this.secondWeight + this.thirdWeight);

  this.lastClose = close;
}

module.exports = Indicator;
