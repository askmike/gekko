var Bitstamp = require("bitstamp");
var util = require('../util.js');
var _ = require('underscore');
var moment = require('moment');
var log = require('../log');

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

Trader.prototype.getTrades = function(since, callback) {
  // bitstamp asks for a `deltatime`, this is the amount of seconds
  // ago from when to fetch trades
  if(since)
    var deltatime = moment.duration(moment() - since).asSeconds();
  else
    deltatime = 600;

  deltatime = Math.round(deltatime);
  setTimeout(_.bind(function(){
    this.bitstamp.transactions(deltatime, function(err, trades) {
      callback(err, {data: trades.reverse()});
    });
  }, this));
}

Trader.prototype.getPortfolio = function(callback) {
  var set = function(err, data) {
    var portfolio = [];
    _.each(data, function(amount, asset) {
      if(asset.indexOf('available') !== -1) {
        asset = asset.substr(0, 3).toUpperCase();
        portfolio.push({name: asset, amount: parseFloat(amount)});
      }
    });
    callback(err, portfolio);
  }
  this.bitstamp.balance(_.bind(set, this));
}

Trader.prototype.getTicker = function(callback) {
  this.bitstamp.ticker(callback);
}

Trader.prototype.getFee = function(callback) {
  var set = function(err, data) {
    callback(err, data.fee / 100);
  }
  this.bitstamp.balance(_.bind(set, this));
}

Trader.prototype.buy = function(amount, price, callback) {
  console.log(amount, price);
  var set = function(err, result) {
    console.log(err, result);
    if(err || result.error)
      return log.error('unable to buy:', err, result);

    callback(err, result.id);
  };

  amount *= 0.995; // remove fees
  // prevent: Ensure that there are no more than 8 digits in total.
  amount *= 100000000;
  amount = Math.floor(amount);
  amount /= 100000000;
  // return console.log(amount);
  this.bitstamp.buy(amount, price, _.bind(set, this));
}

Trader.prototype.sell = function(amount, price, callback) {
  console.log(amount, price);
  var set = function(err, result) {
    console.log(err, result);
    if(err || result.error)
      return log.error('unable to sell:', err, result);

    callback(err, result.id);
  };

  this.bitstamp.sell(amount, price, _.bind(set, this));
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {
    var stillThere = _.find(result, function(o) { return o.id === order });
    callback(err, !stillThere);
  };

  this.bitstamp.open_orders(_.bind(check, this));
}

Trader.prototype.cancelOrder = function(order, callback) {
  var cancel = function(err, result) {
    if(err || !result)
      log.error('unable to cancel order', order, '(', err, result, ')');
  };

  this.bitstamp.cancel_orders(order, _.bind(cancel, this));
}


module.exports = Trader;