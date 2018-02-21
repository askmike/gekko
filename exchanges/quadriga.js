var QuadrigaCX = require('quadrigacx');
var moment = require('moment');
var util = require('../core/util');
var _ = require('lodash');
var log = require('../core/log');


var Trader = function(config) {
  _.bindAll(this);

  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.clientId = config.username;
    this.asset = config.asset.toLowerCase();
    this.currency = config.currency.toLowerCase();
  }
    
  this.pair = this.asset + '_' + this.currency; 
  this.name = 'quadriga';
  this.since = null;

  this.quadriga = new QuadrigaCX(
    this.clientId ? this.clientId : "1",
    this.key ? this.key : "",
    this.secret ? this.secret : "",
  );
}

Trader.prototype.retry = function(method, warn, args, error) {
  var wait = +moment.duration(30, 'seconds');
  if (error.code === 200) {
    log.debug(`${this.name}: API rate limit exceeded! unable to call ${method}, will retry in 2 minutes`)
    wait = +moment.duration(120, 'seconds');
  }
  else {
    log.debug(JSON.stringify(error));
    log.debug(`${this.name}: ${warn}, will retry in 30 seconds`);
  }

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to Trader
  _.each(args, function(arg, i) {
    if(_.isFunction(arg))
      args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, trades) {
    if (trades && trades.error) return this.retry(this.getTrades, 'unable to get trades', args, trades.error);
    if (err) return this.retry(this.getTrades, 'unable to get trades', args, err);

    var parsedTrades = [];
    _.each(trades, function(trade) {
      parsedTrades.push({
        tid: trade.tid,
        date: trade.date,
        price: parseFloat(trade.price),
        amount: parseFloat(trade.amount)
      });
    }, this);

    if(descending)
      callback(null, parsedTrades);
    else
      callback(null, parsedTrades.reverse());
  };

  var reqData = {
    book: this.pair,
    time: 'hour'
  };

  this.quadriga.api('transactions', reqData, _.bind(process, this));
};

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var set = function(err, data) {

    if (data && data.error) return this.retry(this.getPortfolio, 'unable to get balance', args, data.error);
    if (err) return this.retry(this.getPortfolio, 'unable to get balance', args, err);

    var assetAmount = parseFloat( data[this.asset.toLowerCase() + '_available'] );
    var currencyAmount = parseFloat( data[this.currency.toLowerCase() + '_available'] );

    if(!_.isNumber(assetAmount) || _.isNaN(assetAmount)) {
      log.error(`Quadriga did not return balance for ${this.asset.toLowerCase()}, assuming 0.`);
      assetAmount = 0;
    }

    if(!_.isNumber(currencyAmount) || _.isNaN(currencyAmount)) {
      log.error(`Quadriga did not return balance for ${this.currency.toLowerCase()}, assuming 0.`);
      currencyAmount = 0;
    }

    var portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount }
    ];
    callback(err, portfolio);
  };

  this.quadriga.api('balance', _.bind(set, this));
};

Trader.prototype.getFee = function(callback) {
  callback(false, 0.005);
};

Trader.prototype.getTicker = function(callback) {
  var set = function(err, data) {

    if (data && data.error) return this.retry(this.getTicker, 'unable to get quote', args, data.error);
    if (err) return this.retry(this.getTicker, 'unable to get quote', args, err);

    var ticker = {
      ask: data.ask,
      bid: data.bid
    };
    callback(err, ticker);
  };

  this.quadriga.api('ticker', {book: this.pair}, _.bind(set, this));
};

Trader.prototype.roundAmount = function(amount) {
  var precision = 100000000;
  var market = Trader.getCapabilities().markets.find(function(market){ return market.pair[0] === this.currency && market.pair[1] === this.asset });

  if(Number.isInteger(market.precision))
    precision = 10 * market.precision;

  amount *= precision;
  amount = Math.floor(amount);
  amount /= precision;
  return amount;
};

Trader.prototype.addOrder = function(tradeType, amount, price, callback) {
  var args = _.toArray(arguments);

  amount = this.roundAmount(amount);
  log.debug(tradeType.toUpperCase(), amount, this.asset, '@', price, this.currency);

  var set = function(err, data) {

    if (data && data.error) return this.retry(this.addOrder, 'unable to place order', args, data.error);
    if (err) return this.retry(this.addOrder, 'unable to place order', args, err);
    
    var txid = data.id;
    log.debug('added order with txid:', txid);

    callback(undefined, txid);
  };

  this.quadriga.api(tradeType, {
    book: this.pair,
    price: price,
    amount: amount
  }, _.bind(set, this));
};


Trader.prototype.getOrder = function(order, callback) {
  var args = _.toArray(arguments);

  var get = function(err, data) {
    if (data && data.error) return this.retry(this.getOrder, 'unable to get order', args, data.error);
    if (err) return this.retry(this.getOrder, 'unable to get order', args, err);

    var price = parseFloat( data[0].price );
    var amount = parseFloat( data[0].amount );
    var date = (data[0].updated) ? moment.unix( data[0].updated ) : false;

    callback(undefined, {price, amount, date});
  }.bind(this);

  this.quadriga.api('lookup_oder', {id: order}, get);
}

Trader.prototype.buy = function(amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

Trader.prototype.sell = function(amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};

Trader.prototype.checkOrder = function(order, callback) {
  var args = _.toArray(arguments);
  
  var check = function(err, data) {

    if (data && data.error) return this.retry(this.checkOrder, 'unable to get order', args, data.error);
    if (err) return this.retry(this.checkOrder, 'unable to get order', args, err);

    var result = data[0];
    var stillThere = result.status === 0 || result.status === 1;
    callback(err, !stillThere);
  };

  this.quadriga.api('lookup_order', {id: order}, _.bind(check, this));
};

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(err, data) {

    if (data && data.error) return this.retry(this.cancelOrder, 'unable to cancel order', args, data.error);
    if (err) return this.retry(this.cancelOrder, 'unable to cancel order', args, err);

    callback();
  };

  this.quadriga.api('cancel_order', {id: order}, _.bind(cancel, this));
};

Trader.getCapabilities = function () {
  return {
    name: 'Quadriga',
    slug: 'quadriga',
    currencies: ['CAD', 'USD', 'BTC'],
    assets: ['BTC', 'ETH', 'LTC', 'BCH'],
    markets: [
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.00001, unit: 'asset' }, precision: 8 },
      { pair: ['CAD', 'ETH'], minimalOrder: { amount: 0.00001, unit: 'asset' }, precision: 8 },
      { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.00001, unit: 'asset' }, precision: 8 },
      { pair: ['CAD', 'BTC'], minimalOrder: { amount: 0.00001, unit: 'asset' }, precision: 8 },
      { pair: ['CAD', 'LTC'], minimalOrder: { amount: 0.00001, unit: 'asset' }, precision: 8 },
      { pair: ['CAD', 'BCH'], minimalOrder: { amount: 0.00001, unit: 'asset' }, precision: 8 },
    ],
    requires: ['key', 'secret', 'username'],
    providesHistory: false,
    tid: 'tid',
    tradable: true
  };
}

module.exports = Trader;
