/*
  The portfolio manager manages the portfolio on the exchange
*/

const _ = require('lodash');
const events = require('events');
const moment = require('moment');
const checker = require('./exchangeChecker');
const errors = require('./exchangeErrors');
const Portfolio = require('./portfolioManager');

const Broker = function(config) {
  this.config = config;

  // contains current open orders
  this.openOrders = [];
  // contains all closed orders
  this.closedOrders = [];

  const slug = config.exchange.toLowerCase();

  const API = require('./wrappers/' + slug);

  this.api = new API(config);
  if(config.private)
    this.portfolio = new Portfolio(config, this.api);
};

Broker.prototype.cantTrade = function() {
  return checker.cantTrade(this.config);
}

Broker.prototype.init = function(callback) {

  if(!this.config.private) {
    this.setTicker();
    return;
  }

  if(this.cantTrade())
    throw new errors.ExchangeError(this.cantTrade());

  async.series([
    this.setTicker,
    this.portfolio.setFee,
    this.portfolio.setBalances
  ], callback);
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

module.exports = Broker;

