/*
  The broker manages all communicatinn with the exchange, delegating:

  - the management of the portfolio to the portfolioManager
  - the management of actual trades to "orders".
*/

const _ = require('lodash');
const async = require('async');
const events = require('events');
const moment = require('moment');
const checker = require('./exchangeChecker');
const errors = require('./exchangeErrors');
const Portfolio = require('./portfolioManager');
// const Market = require('./market');
const orders = require('./orders');
const bindAll = require('./exchangeUtils').bindAll;

class Broker {
  constructor(config) {
    this.config = config;

    if(config.private) {
      if(this.cantTrade()) {
        throw this.cantTrade();
      }
    } else {
      if(this.cantMonitor()) {
        throw this.cantMonitor();
      }
    }

    if(config.private && this.cantTrade()) {
      throw this.cantTrade();
    }

    this.orders = {
      // contains current open orders
      open: [],
      // contains all closed orders
      closed: []
    }

    const slug = config.exchange.toLowerCase();

    const API = require('./wrappers/' + slug);

    this.api = new API(config);

    this.capabilities = API.getCapabilities();

    this.marketConfig = _.find(this.capabilities.markets, (p) => {
      return _.first(p.pair) === config.currency.toUpperCase() &&
        _.last(p.pair) === config.asset.toUpperCase();
    });

    this.interval = this.api.interval || 1500;

    this.market = config.currency.toUpperCase() + config.asset.toUpperCase();

    if(config.private) {
      this.portfolio = new Portfolio(config, this.api);
    }

    bindAll(this);
  }

  cantTrade() {
    return checker.cantTrade(this.config);
  }

  cantMonitor() {
    return checker.cantMonitor(this.config);
  }

  sync(callback) {
    if(!this.private) {
      this.setTicker();
      return;
    }

    if(this.cantTrade())
      throw new errors.ExchangeError(this.cantTrade());

    this.syncPrivateData();
  }

  syncPrivateData(callback) {
    async.series([
      this.setTicker,
      next => setTimeout(next, this.interval),
      this.portfolio.setFee.bind(this.portfolio),
      next => setTimeout(next, this.interval),
      this.portfolio.setBalances.bind(this.portfolio),
      next => setTimeout(next, this.interval)
    ], callback);
  }

  setTicker(callback) {
    this.api.getTicker((err, ticker) => {

      if(err) {
        if(err.message) {
          console.log(this.api.name, err.message);
          throw err;
        } else {
          console.log('err not wrapped in error:', err);
          throw new errors.ExchangeError(err);
        }
      }

      this.ticker = ticker;

      if(_.isFunction(callback))
        callback();
    });
  }

  createOrder(type, side, amount, parameters, handler) {
    if(!this.config.private)
      throw new Error('Client not authenticated');

    if(side !== 'buy' && side !== 'sell')
      throw new Error('Unknown side ' + side);

    if(!orders[type])
      throw new Error('Unknown order type');

    const order = new orders[type](this.api);

    this.orders.open.push(order);

    // todo: figure out a smarter generic way
    this.syncPrivateData(() => {
      order.setData({
        balances: this.portfolio.balances,
        ticker: this.ticker,
        market: this.marketConfig
      });

      order.create(side, amount, parameters);
    });

    order.on('completed', summary => {
      _.remove(this.orders.open, order);
      this.orders.closed.push(summary);
    });

    return order;
  }
}

module.exports = Broker;