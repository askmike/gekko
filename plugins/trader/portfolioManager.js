/*

  The portfolio manager is responsible for making sure that
  all decisions are turned into orders and make sure these orders
  get executed. Besides the orders the manager also keeps track of
  the client's portfolio.

*/

var _ = require('lodash');
var util = require('../../core/util');
var dirs = util.dirs();
var events = require("events");
var log = require(dirs.core + 'log');
var async = require('async');
var checker = require(dirs.core + 'exchangeChecker.js');

var Manager = function(conf) {
  _.bindAll(this);

  var error = checker.cantTrade(conf);
  if(error)
    util.die(error);

  var exchangeMeta = checker.settings(conf);
  this.exchangeSlug = exchangeMeta.slug;

  // create an exchange
  var Exchange = require(dirs.exchanges + this.exchangeSlug);
  this.exchange = new Exchange(conf);

  this.conf = conf;
  this.portfolio = {};
  this.fee;
  this.order;
  this.action;

  this.directExchange = exchangeMeta.direct;
  this.infinityOrderExchange = exchangeMeta.infinityOrder;

  this.marketConfig = _.find(exchangeMeta.markets, function(p) {
    return p.pair[0] === conf.currency && p.pair[1] === conf.asset;
  });
  this.minimalOrder = this.marketConfig.minimalOrder;

  this.currency = conf.currency;
  this.asset = conf.asset;
};

Manager.prototype.init = function(callback) {
  log.debug('getting balance & fee from', this.exchange.name);
  var prepare = function() {
    this.starting = false;

    log.info('trading at', this.exchange.name, 'ACTIVE');
    log.info(this.exchange.name, 'trading fee will be:', this.fee * 100 + '%');
    this.logPortfolio();

    callback();
  };

  async.series([
    this.setPortfolio,
    this.setFee
  ], _.bind(prepare, this));
}

Manager.prototype.setPortfolio = function(callback) {
  var set = function(err, portfolio) {
    if(err)
      util.die(err);

    this.portfolio = portfolio;

    if(_.isFunction(callback))
      callback();
  }.bind(this);

  this.exchange.getPortfolio(set);
};

Manager.prototype.setFee = function(callback) {
  var set = function(err, fee) {
    this.fee = fee;

    if(err)
      util.die(err);

    if(_.isFunction(callback))
      callback();
  }.bind(this);
  this.exchange.getFee(set);
};

Manager.prototype.setTicker = function(callback) {
  var set = function(err, ticker) {
    this.ticker = ticker;

    if(_.isFunction(callback))
      callback();
  }.bind(this);
  this.exchange.getTicker(set);
};

// return the [fund] based on the data we have in memory
Manager.prototype.getFund = function(fund) {
  return _.find(this.portfolio, function(f) { return f.name === fund});
};
Manager.prototype.getBalance = function(fund) {
  return this.getFund(fund).amount;
};

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

  this.action = what;

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

};

Manager.prototype.getMinimum = function(price) {
  if(this.minimalOrder.unit === 'currency')
    return minimum = this.minimalOrder.amount / price;
  else
    return minimum = this.minimalOrder.amount;
};

// first do a quick check to see whether we can buy
// the asset, if so BUY and keep track of the order
// (amount is in asset quantity)
Manager.prototype.buy = function(amount, price) {

  // sometimes cex.io specifies a price w/ > 8 decimals
  price *= 100000000;
  price = Math.floor(price);
  price /= 100000000;

  var currency = this.getFund(this.currency);
  var minimum = this.getMinimum(price);
  var available = this.getBalance(this.currency) / price;

  // if not sufficient funds
  if(amount > available) {
    return log.info(
      'Wanted to buy ' + amount + ' but insufficient',
      this.currency,
      '(' + available.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  // if order to small
  if(amount < minimum) {
    return log.info(
      'Wanted to buy',
      this.asset,
      'but the amount is too small',
      '(' + amount.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  log.info(
    'Attempting to BUY',
    amount,
    this.asset,
    'at',
    this.exchange.name
  );
  this.exchange.buy(amount, price, this.noteOrder);
};

// first do a quick check to see whether we can sell
// the asset, if so SELL and keep track of the order
// (amount is in asset quantity)
Manager.prototype.sell = function(amount, price) {
  // sometimes cex.io specifies a price w/ > 8 decimals
  price *= 100000000;
  price = Math.ceil(price);
  price /= 100000000;

  var minimum = this.getMinimum(price);
  var availabe = this.getBalance(this.asset);

  // if not suficient funds
  if(amount < availabe) {
    return log.info(
      'Wanted to sell ' + amount + ' but insufficient',
      this.asset,
      '(' + availabe.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  // if order to small
  if(amount < minimum) {
    return log.info(
      'Wanted to buy',
      this.currency,
      'but the amount is to small',
      '(' + amount.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  log.info(
    'Attempting to SELL',
    amount,
    this.asset,
    'at',
    this.exchange.name
  );
  this.exchange.sell(amount, price, this.noteOrder);
};

Manager.prototype.noteOrder = function(err, order) {
  this.order = order;
  // if after 1 minute the order is still there
  // we cancel and calculate & make a new one
  setTimeout(this.checkOrder, util.minToMs(1));
};

// check whether the order got fully filled
// if it is not: cancel & instantiate a new order
Manager.prototype.checkOrder = function() {
  var finish = function(err, filled) {
    if(!filled) {
      log.info(this.action, 'order was not (fully) filled, cancelling and creating new order');
      this.exchange.cancelOrder(this.order);

      // Delay the trade, as cancel -> trade can trigger
      // an error on cex.io if they happen on the same
      // unix timestamp second (nonce will not increment).
      var self = this;
      setTimeout(function() { self.trade(self.action); }, 500);
      return;
    }

    log.info(this.action, 'was successfull');
  }

  this.exchange.checkOrder(this.order, _.bind(finish, this));
}

Manager.prototype.logPortfolio = function() {
  log.info(this.exchange.name, 'portfolio:');
  _.each(this.portfolio, function(fund) {
    let fundAmount = parseFloat(fund.amount)
    log.info('\t', fund.name + ':', fundAmount.toFixed(12));
  });
};

module.exports = Manager;
