// Richard King, 2 Feb
// Built as a fix to the DEMA.js indicator that wasn't accurate.

// required indicators
var EMA = require('./EMA.js');

var Indicator = function(period) {
  this.input = 'price'	
  this.result = false;
  this.ema = new EMA(period);
  this.doubleEMA = new EMA(period);
}

// add a price and calculate the EMAs and
// the diff for that price
Indicator.prototype.update = function(price) {
  this.ema.update(price);
  var EMA = this.ema.result;
  this.doubleEMA.update(EMA);
  this.calculateDoubleEMA();
}

// Formula https://www.investopedia.com/ask/answers/121814/what-double-exponential-moving-average-dema-formula-and-how-it-calculated.asp
Indicator.prototype.calculateDoubleEMA = function() {
  
  var EMA = this.ema.result;
  var doubleEMA = this.doubleEMA.result;
  
  this.result = (2 * EMA) - doubleEMA;
  
}

module.exports = Indicator;