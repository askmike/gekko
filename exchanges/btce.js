var BTCE = require('btc-e');

var moment = require('moment');
var util = require('../util.js');
var _ = require('underscore');

var trader = function(key, secret) {
  this.key = key;
  this.secret = secret;
  this.name = 'BTC-E';
  this.btce = new BTCE(this.key, this.secret);
}

trader.prototype.trade = function(what) {
  if(what !== 'BUY' && what !== 'SELL')
    return;

  // hacky workaround, btc-e module needs a callback
  var devNull = function() {};

  this.getAveragePrice(function(price) {
    console.log(util.now(), 'NOW going to', what, '@', this.name);  
    if(what === 'BUY')
      this.btce.trade('btc_usd', 'buy', price, 1000, devNull);
    if(what === 'SELL')
      this.btce.trade('btc_usd', 'sell', price, 1000, devNull);
  });
}

// we can't place an order against market price at BTC-e so we have to calculate
// the price in this exchange because the prices per exchange can differ.
trader.prototype.getAveragePrice = function(callback) {
  var process = function(err, trades) {
    var price = this.calculateAveragePrice(trades);
    callback(price);
  }
  callback = _.bind(callback, this);
  process = _.bind(process, this);

  this.btce.trades('btc_usd', process);
}

// get the average price of all trades that happened within 20 seconds of the most 
// recent trade.
trader.prototype.calculateAveragePrice = function(trades) {
  var sample = [];
  var treshold = moment.unix(_.first(trades).date).subtract('seconds', 20);
  _.every(trades, function(trade) {
    if(moment.unix(trade.date) < treshold)
      return false

    var price = parseFloat(trade.price);
    sample.push(price);
    return true;
  });

  return util.average(sample).toFixed(3);
}

module.exports = trader;