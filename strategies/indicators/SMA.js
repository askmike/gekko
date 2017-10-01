// required indicators
// Simple Moving Average - O(1) implementation 

var Indicator = function(windowLength) {
  this.windowLength = windowLength;
  this.prices = [];
  this.result = 0;
  this.age = 0;
  this.sum = 0;
}

Indicator.prototype.update = function(price) {
  var tail = this.prices[this.age] || 0; // oldest price in window
  this.prices[this.age] = price;
  this.sum += price - tail;
  this.result = this.sum / this.prices.length;
  this.age = (this.age + 1) % this.windowLength
}

module.exports = Indicator;
