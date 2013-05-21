var BTCE = require('btc-e');

var moment = require('moment');
var util = require('../util.js');
var _ = require('underscore');

var trader = function(config) {
  this.key = config.key;
  this.secret = config.secret;
  this.pair = 'btc_' + config.currency.toLowerCase();
  this.name = 'BTC-E';

  _.bindAll(this);

  this.btce = new BTCE(this.key, this.secret);
}

trader.prototype.trade = function(what) {
  if(what !== 'BUY' && what !== 'SELL')
    return;

  // hacky workaround, btc-e module needs a callback
  var devNull = function() {};

  this.getAveragePrice(function(price) {
    // the BTC-e API won't handle precision numbers
    price = price.toFixed(3);
    console.log(util.now(), 'NOW going to', what, '@', this.name);  
    if(what === 'BUY')
      this.btce.trade(this.pair, 'buy', price, 1000, devNull);
    if(what === 'SELL')
      this.btce.trade(this.pair, 'sell', price, 1000, devNull);
  });
}

// we can't place an order against market price at BTC-e so we have to calculate
// the price in this exchange because the prices per exchange can differ.
trader.prototype.getAveragePrice = function(callback) {
  var process = function(err, trades) {
    var treshold = moment.unix(_.first(trades).date).subtract('seconds', 20);
    var price = util.calculatePriceSince(treshold, trades);
    callback(price);
  }
  callback = _.bind(callback, this);
  process = _.bind(process, this);

  this.btce.trades('btc_usd', process);
}

module.exports = trader;