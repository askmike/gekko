/*
  The broker manages all communicatinn with the exchange, delegating:

  - the management of the portfolio to the portfolioManager
  - the management of actual trades to orders.
*/

const _ = require('lodash');
const async = require('async');
const events = require('events');
const moment = require('moment');
const checker = require('./exchangeChecker');
const errors = require('./exchangeErrors');
const Portfolio = require('./portfolioManager');
const orders = require('./orders');

const Broker = function(config) {
  _.bindAll(this);
  this.config = config;

  this.orders = {
    // contains current open orders
    open: [],
    // contains all closed orders
    closed: []
  }

  const slug = config.exchange.toLowerCase();

  const API = require('./wrappers/' + slug);

  this.api = new API(config);

  this.marketConfig = _.find(API.getCapabilities().markets, (p) => {
    return _.first(p.pair) === config.currency.toUpperCase() &&
      _.last(p.pair) === config.asset.toUpperCase();
  });

  this.market = config.currency.toUpperCase() + config.asset.toUpperCase();

  if(config.private) {
    this.portfolio = new Portfolio(config, this.api);
  }
};

Broker.prototype.cantTrade = function() {
  return checker.cantTrade(this.config);
}

Broker.prototype.sync = function(callback) {

  if(!this.private) {
    this.setTicker();
    return;
  }

  if(this.cantTrade())
    throw new errors.ExchangeError(this.cantTrade());

  this.syncPrivateData();
}

Broker.prototype.syncPrivateData = function(callback) {
  async.series([
    this.setTicker,
    this.portfolio.setFee.bind(this.portfolio),
    this.portfolio.setBalances.bind(this.portfolio)
  ], callback);
}

Broker.prototype.getPrivate = function(callback) {

}

Broker.prototype.setTicker = function(callback) {
  this.api.getTicker((err, ticker) => {
    if(err)
      throw new errors.ExchangeError(err);

    this.ticker = ticker;

    if(_.isFunction(callback))
      callback();
  });
}

Broker.prototype.createOrder = function(type, side, size, parameters, handler) {
  if(!this.config.private)
    throw new Error('Client not authenticated');

  if(side !== 'buy' && side !== 'sell')
    throw new Error('Unknown side ' + side);

  if(!orders[type])
    throw new Error('Unknown order type');

  let amount = size.amount;

  if(size.in === this.config.currency) {

    if(!parameters || !parameters.price)
      throw 'no price :(';
      
    const price = parameters.price;

    amount /= price;
  }

  const order = new orders[type](this.api);

  this.orders.open.push(order);

  this.syncPrivateData(() => {
    order.setData({
      balances: this.portfolio.balances,
      ticker: this.ticker,
      market: this.marketConfig
    });

    order.create(side, amount, parameters)
  });

  order.on('completed', summary => {
    _.remove(this.orders.open, order);
    this.orders.closed.push(summary);
  });

  return order;
}

module.exports = Broker;