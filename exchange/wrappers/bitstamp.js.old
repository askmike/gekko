var Bitstamp = require("bitstamp");
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');
var util = require('../core/util');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.clientID = config.username;
    this.asset = config.asset.toLowerCase();
    this.currency = config.currency.toLowerCase();
    this.market = this.asset + this.currency;
  }
  this.name = 'Bitstamp';

  this.bitstamp = new Bitstamp(this.key, this.secret, this.clientID);
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
  var set = function(err, data) {

    if(data && data.error) {
      err = data.error;
    }

    if(err) {
      if(err.meta && err.meta.reason === 'API key not found')
        util.die('Bitstamp says this API keys is invalid..');

      log.error('BITSTAMP API ERROR:', err);
      return this.retry(this.getPortfolio, args);
    }

    var portfolio = [];
    _.each(data, function(amount, asset) {
      if(asset.indexOf('available') !== -1) {
        asset = asset.substr(0, 3).toUpperCase();
        portfolio.push({name: asset, amount: parseFloat(amount)});
      }
    });
    callback(err, portfolio);
  }.bind(this);

  this.bitstamp.balance(this.market, set);
}

Trader.prototype.getTicker = function(callback) {
  this.bitstamp.ticker(this.market, callback);
}

Trader.prototype.getFee = function(callback) {
  var set = function(err, data) {
    if(err)
      callback(err);

    callback(false, data.fee / 100);
  }.bind(this);

  this.bitstamp.balance(this.market, set);
}

Trader.prototype.buy = function(amount, price, callback) {
  var findMarket = function(pair) {
    return pair.pair[0].toLowerCase() === this.currency && pair.pair[1].toLowerCase() === this.asset
  }
  var args = _.toArray(arguments);
  var set = function(err, result) {
    if(err || result.status === "error") {
      log.error('unable to buy:', err, result.reason, 'retrying...');
      return this.retry(this.buy, args);
    }

    callback(null, result.id);
  }.bind(this);

  //Decrease amount by 1% to avoid trying to buy more than balance allows.
  amount = Number(amount * 0.99).toFixed(8);

  // Use proper precision by currency pair
  var pair = _.find(Trader.getCapabilities().markets, _.bind(findMarket, this));
  price = Number(Number.parseFloat(price).toFixed(pair.precision));

  this.bitstamp.buy(this.market, amount, price, undefined, set);
}

Trader.prototype.sell = function(amount, price, callback) {
  var findMarket = function(pair) {
    return pair.pair[0].toLowerCase() === this.currency && pair.pair[1].toLowerCase() === this.asset
  }
  var args = _.toArray(arguments);
  var set = function(err, result) {
    if(err || result.status === "error") {
      log.error('unable to sell:', err, result.reason, 'retrying...');
      return this.retry(this.sell, args);
    }

    callback(null, result.id);
  }.bind(this);

  // prevent:
  // 'Ensure that there are no more than 8 decimal places.'
  amount = Number(Number.parseFloat(amount)).toFixed(8);

  // Use proper precision by currency pair
  var pair = _.find(Trader.getCapabilities().markets, _.bind(findMarket, this));
  price = Number(Number.parseFloat(price).toFixed(pair.precision));

  this.bitstamp.sell(this.market, amount, price, undefined, set);
}


Trader.prototype.getOrder = function(id, callback) {
  var args = _.toArray(arguments);
  var get = function(err, data) {
    if(!err && _.isEmpty(data) && _.isEmpty(data.result))
      err = 'no data';

    else if(!err && !_.isEmpty(data.error))
      err = data.error;

    if(err) {
      log.error('Unable to get order', order, JSON.stringify(err));
      return this.retry(this.getOrder, args);
    }

    var order = _.find(data, o => o.order_id === +id);

    if(!order) {
      // if the order was cancelled we are unable
      // to retrieve it, assume that this is what
      // is happening.
      return callback(err, {
        price: 0,
        amount: 0,
        date: moment(0)
      });
    }

    var price = parseFloat( order[`${this.asset}_${this.currency}`] );
    var amount = Math.abs(parseFloat( order[this.asset] ));
    var date = moment( order.datetime );

    callback(err, {price, amount, date});
  }.bind(this);

  this.bitstamp.user_transactions(this.market, {}, get);
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {
    var stillThere = _.find(result, function(o) { return o.id === order });
    callback(err, !stillThere);
  }.bind(this);

  this.bitstamp.open_orders(this.market, check);
}

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(err, result) {
    if(err || !result) {
      log.error('unable to cancel order', order, '(', err, result, ')');
      return this.retry(this.cancelOrder, args);
    }

    callback();
  }.bind(this);

  this.bitstamp.cancel_order(order, cancel);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, trades) {
    if(err)
      return this.retry(this.getTrades, args);

    var result = _.map(trades, t => {
      return {
        date: t.date,
        tid: +t.tid,
        price: +t.price,
        amount: +t.amount
      }
    })

    callback(null, result.reverse());
  }.bind(this);

  // NOTE: temporary disabled, see https://github.com/askmike/gekko/issues/794
  // if(since)
  //   this.bitstamp.transactions(this.market, {time: 'day'}, process);
  // else
  this.bitstamp.transactions(this.market, process);
}

Trader.getCapabilities = function () {
  return {
    name: 'Bitstamp',
    slug: 'bitstamp',
    currencies: ['USD', 'EUR', 'BTC'],
    assets: ['BTC', 'BCH', 'EUR', 'LTC', 'ETH', 'XRP'],
    maxTradesAge: 60,
    maxHistoryFetch: null,
    markets: [
      { pair: ['USD', 'EUR'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },

      { pair: ['USD', 'BTC'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
      { pair: ['EUR', 'BTC'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },

      { pair: ['USD', 'BCH'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
      { pair: ['EUR', 'BCH'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
      { pair: ['BTC', 'BCH'], minimalOrder: { amount: 0.001, unit: 'currency'}, precision: 8  },

      { pair: ['USD', 'XRP'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 5 },
      { pair: ['EUR', 'XRP'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 5 },
      { pair: ['BTC', 'XRP'], minimalOrder: { amount: 0.001, unit: 'currency'}, precision: 8  },

      { pair: ['USD', 'LTC'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.001, unit: 'currency'}, precision: 8  },

      { pair: ['USD', 'ETH'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
      { pair: ['EUR', 'ETH'], minimalOrder: { amount: 5, unit: 'currency' }, precision: 2 },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.001, unit: 'currency'}, precision: 8  },
    ],
    requires: ['key', 'secret', 'username'],
    fetchTimespan: 60,
    tid: 'tid',
    tradable: true
  };
}

module.exports = Trader;
