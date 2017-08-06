// required indicators

var Indicator = function(weight) {
  this.weight = weight;
  this.prices = [];
  this.result = 0;
  this.age = 0;
}

Indicator.prototype.update = function(price) {
  this.prices[this.age % this.weight] = price;
  var sum = this.prices.reduce(function(a, b) { return a + b; }, 0);
  this.result = sum / this.prices.length;
  this.age++;
}

module.exports = Indicator;
