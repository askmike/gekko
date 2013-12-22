/*

  The portfolio manager is responsible for making sure that
  all decisions are turned into orders and make sure these orders
  get executed. Besides the orders the manager also keeps track of
  the client's portfolio.

*/

var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var Util = require("util");
var util = require('./util')
var events = require("events");
var log = require('./log');
var async = require('async');
var exchangeChecker = require('./exchangeChecker.js');
var exchanges = require('./exchanges.js');

var Manager = function(conf) {
  this.exchangeSlug = conf.exchange.toLowerCase();
  var exchange = _.find(exchanges, function(e) { return e.slug === this.exchangeSlug }, this);

  // create an exchange
  var Exchange = require('./exchanges/' + this.exchangeSlug);
  this.exchange = new Exchange(conf);

  //    state
  this.conf = conf;
  this.portfolio = {};
  this.fee;
  this.order;
  this.action;

  this.directExchange = exchange.direct;
  this.infinityOrderExchange = exchange.infinityOrder;
  this.minimalOrder = exchange.minimalOrder;

  this.currency = conf.currency || 'USD';
  this.asset = conf.asset || 'BTC';

  _.bindAll(this);

  log.debug('getting balance & fee from', this.exchange.name);
  var prepare = function() {
    this.starting = false;

    log.info('trading at', this.exchange.name, 'ACTIVE');
    log.info(this.exchange.name, 'trading fee will be:', this.fee * 100 + '%');
    this.logPortfolio();
    this.emit('ready');
  };

  async.series([
    this.setPortfolio,
    this.setFee
  ], _.bind(prepare, this));

  // Because on cex.io your asset grows refresh and
  // display portfolio stats every 11 minutes
  if(this.exchange.name === 'cex.io')
    setInterval(this.displayPortfolio, util.minToMs( 11 ));
}

// teach our Manager events
Util.inherits(Manager, events.EventEmitter);

Manager.prototype.setPortfolio = function(callback) {
  var set = function(err, portfolio) {
    this.portfolio = portfolio;
    callback();
  };
  this.exchange.getPortfolio(_.bind(set, this));
}

Manager.prototype.setFee = function(callback) {
  var set = function(err, fee) {
    this.fee = fee;
    callback();
  };
  this.exchange.getFee(_.bind(set, this));
}

Manager.prototype.setTicker = function(callback) {
  var set = function(err, ticker) {
    this.ticker = ticker;
    callback();
  }
  this.exchange.getTicker(_.bind(set, this));
}

// return the [fund] based on the data we have in memory
Manager.prototype.getFund = function(fund) {
  return _.find(this.portfolio, function(f) { return f.name === fund});
}
Manager.prototype.getBalance = function(fund) {
  return this.getFund(fund).amount;
}

// This function makes sure order get to the exchange
// and initiates follow up to make sure the orders will
// get executed. This is the backbone of the portfolio 
// manager.
// 
// How this is done depends on a couple of things:
// 
// is this a directExchange? (does it support MKT orders)
// is this a infinityOrderExchange (does it support order
// requests bigger then the current balance?)
Manager.prototype.trade = function(what) {
  if(what !== 'BUY' && what !== 'SELL')
    return;

  var act = function() {
    var amount, price;

    if(what === 'BUY') {

      // do we need to specify the amount we want to buy?
      if(this.infinityOrderExchange)
        amount = 10000;
      else
        amount = this.getBalance(this.currency) / this.ticker.ask;

      // can we just create a MKT order?
      if(this.directExchange)
        price = false;
      else
        price = this.ticker.ask;

      this.buy(amount, price);

    } else if(what === 'SELL') {

      // do we need to specify the amount we want to sell?
      if(this.infinityOrderExchange)
        amount = 10000;
      else
        amount = this.getBalance(this.asset);

      // can we just create a MKT order?
      if(this.directExchange)
        price = false;
      else
        price = this.ticker.bid;
      
      this.sell(amount, price);
    }
  };
  async.series([
    this.setTicker,
    this.setPortfolio
  ], _.bind(act, this));

}

Manager.prototype.getMinimum = function(price) {
  if(this.minimalOrder.unit === 'currency')
    return minimum = this.minimalOrder.amount / price;
  else
    return minimum = this.minimalOrder.amount;
}

// first do a quick check to see whether we can buy
// the asset, if so BUY and keep track of the order
// (amount is in asset quantity)
Manager.prototype.buy = function(amount, price) {
  // sometimes cex.io specifies a price w/ > 8 decimals
  price *= 100000000;
  price = Math.ceil(price);
  price /= 100000000;

  var currency = this.getFund(this.currency);
  var minimum = this.getMinimum(price);

  if(amount > minimum) {
    log.info('attempting to BUY',
             amount, this.asset,
             'at', this.exchange.name);
    this.exchange.buy(amount, price, this.noteOrder);
    this.action = 'BUY';
  } else
    log.info('wanted to buy but insufficient',
             this.currency,
             '(' + amount * price + ') at', this.exchange.name);
}

// first do a quick check to see whether we can sell
// the asset, if so SELL and keep track of the order
// (amount is in asset quantity)
Manager.prototype.sell = function(amount, price) {
  // sometimes cex.io specifies a price w/ > 8 decimals
  price *= 100000000;
  price = Math.ceil(price);
  price /= 100000000;

  var asset = this.getFund(this.asset);
  var minimum = this.getMinimum(price);
  if(amount > minimum) {
    log.info('attempting to SELL',
             amount, this.asset,
             'at', this.exchange.name);
    this.exchange.sell(amount, price, this.noteOrder);
    this.action = 'SELL';
  } else
    log.info('wanted to sell but insufficient',
             this.asset,
             '(' + amount + ') at', this.exchange.name);
}

Manager.prototype.noteOrder = function(order) {
  this.order = order;
  // if after 30 seconds the order is still there
  // we cancel and calculate & make a new one
  setTimeout(this.checkOrder, util.minToMs(0.5));
}

// check wether the order got fully filled
// if it is not: cancel & instantiate a new order
Manager.prototype.checkOrder = function() {
  var finish = function(err, filled) {
    if(!filled) {
      log.info(this.action, 'order was not (fully) filled, canceling and creating new order');
      this.exchange.cancelOrder(this.order);
      return this.trade(this.action);
    }

    log.info(this.action, 'was succesfull');
  }

  this.exchange.checkOrder(this.order, _.bind(finish, this));
}

Manager.prototype.logPortfolio = function() {
  log.info('refreshed', this.exchange.name, 'portfolio:');
  _.each(this.portfolio, function(fund) {
    log.info('\t', fund.name + ':', fund.amount);
  });
}

Manager.prototype.displayPortfolio = function() {
  this.setPortfolio(this.logPorfolio);
}

module.exports = Manager;
