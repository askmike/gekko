var Gemini = require('gemini-exchange-coffee-api/lib/gemini');
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
  }
  this.name = 'Gemini';
  this.balance;
  this.price;
  this.asset = config.asset;
  this.currency = config.currency;
  this.pair = this.asset + this.currency;
  this.gemini = new Gemini(this.key, this.secret);
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

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
}

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  this.gemini.wallet_balances(function (err, data, body) {

    if(err && err.message === '401') {
      let e = 'Gemini replied with an unauthorized error. ';
      e += 'Double check whether your API key is correct.';
      util.die(e);
    }

    if(err || !data)
      return this.retry(this.getPortfolio, args);

    // We are only interested in funds in the "exchange" wallet
    data = data.filter(c => c.type === 'exchange');

    const asset = _.find(data, c => c.currency.toUpperCase() === this.asset);
    const currency = _.find(data, c => c.currency.toUpperCase() === this.currency);

    let assetAmount, currencyAmount;

    if(_.isObject(asset) && _.isNumber(+asset.available) && !_.isNaN(+asset.available))
      assetAmount = +asset.available;
    else {
      log.error(`Gemini did not provide ${this.asset} amount, assuming 0`);
      assetAmount = 0;
    }

    if(_.isObject(currency) && _.isNumber(+currency.available) && !_.isNaN(+currency.available))
      currencyAmount = +currency.available;
    else {
      log.error(`Gemini did not provide ${this.currency} amount, assuming 0`);
      currencyAmount = 0;
    }

    const portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount },
    ];

    callback(err, portfolio);
  }.bind(this));
}

Trader.prototype.getTicker = function(callback) {
  var args = _.toArray(arguments);
  // the function that will handle the API callback
  var process = function(err, data, body) {
    if (err)
        return this.retry(this.getTicker(args));

    // whenever we reach this point we have valid
    // data, the callback is still the same since
    // we are inside the same javascript scope.
    callback(err, {bid: +data.bid, ask: +data.ask})
  }.bind(this);
  this.gemini.ticker(this.pair, process);
}

// This assumes that only limit orders are being placed, so fees are the
// "maker fee" of 0.1%.  It does not take into account volume discounts.
Trader.prototype.getFee = function(callback) {
    var makerFee = 0.25;
    callback(false, makerFee / 100);
}

Trader.prototype.submit_order = function(type, amount, price, callback) {
  var args = _.toArray(arguments);

  amount = Math.floor(amount*100000000)/100000000;
  this.gemini.new_order(
    this.pair,
    amount + '',
    price + '',
    this.name.toLowerCase(),
    type,
    'exchange limit',
    function (err, data, body) {
      if (err) {
        log.error('unable to ' + type, err, body);
        return this.retry(this.submit_order, args);
      }

      callback(err, data.order_id);
    }.bind(this));
}

Trader.prototype.buy = function(amount, price, callback) {
  this.submit_order('buy', amount, price, callback);
}

Trader.prototype.sell = function(amount, price, callback) {
  this.submit_order('sell', amount, price, callback);
}

Trader.prototype.checkOrder = function(order_id, callback) {
  var args = _.toArray(arguments);
  this.gemini.order_status(order_id, function (err, data, body) {

    if(err || !data)
      return this.retry(this.checkOrder, arguments);

    callback(err, !data.is_live);
  }.bind(this));
}


Trader.prototype.getOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var get = function(err, data) {
    if(err || !data)
      return this.retry(this.getOrder, arguments);

    var price = parseFloat(data.avg_execution_price);
    var amount = parseFloat(data.executed_amount);
    var date = moment.unix(data.timestamp);

    callback(undefined, {price, amount, date});
  }.bind(this);

  this.gemini.order_status(order, get);
}


Trader.prototype.cancelOrder = function(order_id, callback) {
  var args = _.toArray(arguments);
  this.gemini.cancel_order(order_id, function (err, data, body) {
      if (err || !data) {
        // gemini way of telling it was already cancelled..
        if(err.message === 'Order could not be cancelled.')
          return callback();

        log.error('unable to cancel order', order_id, '(', err, data, '), retrying...');
        return this.retry(this.cancelOrder, args);
      }

      return callback();
  }.bind(this));
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);

  var path = this.pair;
  if(since)
    path += '?limit_trades=2000';

  this.gemini.trades(path, function(err, data) {
    if (err)
      return this.retry(this.getTrades, args);

    var trades = _.map(data, function(trade) {
      return {
        tid: trade.tid,
        date:  trade.timestamp,
        price: +trade.price,
        amount: +trade.amount
      }
    });

    callback(null, descending ? trades : trades.reverse());
  }.bind(this));
}

Trader.getCapabilities = function () {
  return {
    name: 'Gemini',
    slug: 'gemini',
    currencies: ['USD', 'BTC'],
    assets: ['BTC', 'ETH'],
    markets: [
      
        { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
        { pair: ['USD', 'ETC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
        { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },

    ],
    requires: ['key', 'secret'],
    tid: 'tid',
    tradable: true
  };
}

module.exports = Trader;
