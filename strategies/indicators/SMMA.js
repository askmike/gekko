// required indicators
var SMA = require('./SMA');

var Indicator = function (weight) {
  this.input = 'price';
  this.sma = new SMA(weight);
  this.weight = weight;
  this.prices = [];
  this.result = 0;
  this.age = 0;
}

Indicator.prototype.update = function (price) {
  this.prices[this.age] = price;

  if(this.prices.length < this.weight) {
    this.sma.update(price);
  } else if(this.prices.length === this.weight) {
    this.sma.update(price);
    this.result = this.sma.result;
  } else {
    this.result = (this.result * (this.weight - 1) + price) / this.weight;
  }

  this.age++;
}

module.exports = Indicator;
