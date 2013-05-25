var Bitstamp = require("bitstamp");
var util = require('../util.js');
var _ = require('underscore');
var moment = require('moment');

var Trader = function(config) {
  if(_.isObject(config)) {
    this.user = config.user;
    this.password = config.password;
  }
  this.name = 'Bitstamp';
  this.balance;
  this.price;

  _.bindAll(this);

  this.bitstamp = new Bitstamp(this.user, this.password);
}

Trader.prototype.trade = function(what) {
  if(what !== 'BUY' && what !== 'SELL')
    return;

  var devNull = function() {};

  var act = function() {
    log.info('NOW going to', what, '@', this.name);  
    if(what === 'BUY') {
      this.price = (this.price * 1.001).toFixed(2);
      var amount = this.balance.usd_balance / this.price * 0.995;
      // NOTE: "amount: Ensure that there are no more than 8 digits in total."
      // this breaks over xxx bitcoin
      amount = amount.toFixed(5);
      this.bitstamp.buy(amount, this.price, devNull);
    }

    if(what === 'SELL') {
      this.price = (this.price * 0.999).toFixed(2);
      this.bitstamp.sell(this.balance.btc_balance, this.price, devNull);
    }
  }

  act = _.bind(act, this);
  var doAct = _.after(2, act);

  this.getAveragePrice(function(price) {
    this.price = price;
    doAct();
  });
  this.getBalance(function(err, balance) {
    this.balance = balance;
    doAct();
  });
  
}

Trader.prototype.getTrades = function(since, callback) {
  // bitstamp asks for a `deltatime`, this is the amount of seconds
  // ago from when to fetch trades
  if(since)
    var deltatime = moment.duration(moment() - since).asSeconds();
  else
    deltatime = 600;

  deltatime = Math.round(deltatime);
  this.bitstamp.transactions(deltatime, function(err, trades) {
    callback(err, {data: trades.reverse()});
  });
}

// Bitstamp doesn't allow order bigger than your balance
Trader.prototype.getBalance = function(callback) {
  callback = _.bind(callback, this);
  this.bitstamp.balance(callback);
}

// we can't place an order against market price at Bitstamp so we have to calculate
// the price in this exchange because the prices per exchange can differ.
Trader.prototype.getAveragePrice = function(callback) {
  var process = function(err, trades) {
    var treshold = moment.unix(_.first(trades).date).subtract('seconds', 30);
    var price = util.calculatePriceSince(treshold, trades);
    callback(price);
  }
  callback = _.bind(callback, this);
  process = _.bind(process, this);

  this.bitstamp.transactions(600, process);
}

module.exports = Trader;