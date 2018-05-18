const moment = require('moment');
const util = require('../core/util');
const _ = require('lodash');
const log = require('../core/log');
const marketData = require('./coinfalcon-markets.json');

const CoinFalcon = require('coinfalcon');

var Trader = function(config) {
  _.bindAll(this);

  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase();
    this.asset = config.asset.toUpperCase();
  }

  this.pair = this.asset + '-' + this.currency;
  this.name = 'coinfalcon';

  this.coinfalcon = new CoinFalcon.Client(this.key, this.secret);
};

var recoverableErrors = new RegExp(
  /(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|429|522)/
);

Trader.prototype.retry = function(method, args, error) {
  var self = this;
  // make sure the callback (and any other fn) is bound to Trader
  _.each(args, function(arg, i) {
    if (_.isFunction(arg)) {
      args[i] = _.bind(arg, self);
    }
  });

  log.debug('[CoinFalcon] ', this.name, "Retrying...");

  if (!error || !error.message.match(recoverableErrors)) {
    log.error('[CoinFalcon] ', this.name, 'returned an irrecoverable error');
    _.each(args, function(arg, i) {
      if (_.isFunction(arg)) {
        arg(error, null);
        return;
      }
    });
    return;
  }

  var wait = +moment.duration(5, 'seconds');

  // run the failed method again with the same arguments after wait
  setTimeout(function() {
    method.apply(self, args);
  }, wait);
};

Trader.prototype.getTicker = function(callback) {
  var success = function(res) {
    callback(null, {bid: +res.data.bids[0].price, ask: +res.data.asks[0].price})
  };

  var failure = function(err) {
    log.error('[CoinFalcon] error getting ticker', err);
    callback(err, null);
  };

  var url = "markets/" + this.pair + "/orders?level=1"

  this.coinfalcon.get(url).then(success).catch(failure);
};

Trader.prototype.getFee = function(callback) {
  var fees = 0.25; // 0.25% for both sell & buy
  callback(false, fees / 100);
};

Trader.prototype.getPortfolio = function(callback) {
  var success = function(res) {
    if (_.has(res, 'error')) {
      var err = new Error(res.error);
      callback(err, null);
    } else {
      var portfolio = res.data.map(function(account) {
        return {
          name: account.currency,
          amount: parseFloat(account.available)
        }
      });
      callback(null, portfolio);
    }
  };

  var failure = function(err) {
    log.error('[CoinFalcon] error getting portfolio', err);
    callback(err, null);
  }

  this.coinfalcon.get('user/accounts').then(success).catch(failure);
};

Trader.prototype.addOrder = function(type, amount, price, callback) {
  var args = _.toArray(arguments);

  var success = function(res) {
    if (_.has(res, 'error')) {
      var err = new Error(res.error);
      failure(err);
    } else {
      callback(false, res.data.id)
    }
  };

  var failure = function(err) {
    log.error('[CoinFalcon] unable to ' + type.toLowerCase(), err);
    return this.retry(this.addOrder, args, err);
  }.bind(this);

  var payload = {
    order_type: type,
    operation_type: 'limit_order',
    market: this.pair,
    size: amount,
    price: price
  }

  this.coinfalcon.post('user/orders', payload).then(success).catch(failure);
};

['buy', 'sell'].map(function(type) {
  Trader.prototype[type] = function(amount, price, callback) {
    this.addOrder(type, amount, price, callback);
  };
});

Trader.prototype.getOrder = function(order, callback) {
  var success = function(res) {
    if (_.has(res, 'error')) {
      var err = new Error(res.error);
      failure(err);
    } else {
      var price = parseFloat(res.data.price);
      var amount = parseFloat(res.data.size);
      var date = moment(res.data.created_at);
      callback(false, { price, amount, date });
    }
  };

  var failure = function(err) {
    log.error('[CoinFalcon] unable to getOrder', err);
    callback(err, null);
  }.bind(this);

  this.coinfalcon.get('user/orders/' + order).then(success).catch(failure);
};

Trader.prototype.checkOrder = function(order, callback) {
  var success = function(res) {
    if (_.has(res, 'error')) {
      var err = new Error(res.error);
      failure(err);
    } else {
      var filled = res.data.status == "canceled" || res.data.status == "fulfilled";
      callback(false, filled);
    }
  };

  var failure = function(err) {
    log.error('[CoinFalcon] unable to checkOrder', err);
    callback(err, null);
  }.bind(this);

  this.coinfalcon.get('user/orders/' + order).then(success).catch(failure);
};

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var success = function(res) {
    if (_.has(res, 'error')) {
      var err = new Error(res.error);
      failure(err);
    } else {
      callback(false, res.data.id)
    }
  };

  var failure = function(err) {
    log.error('[CoinFalcon] unable to cancel', err);
    return this.retry(this.cancelOrder, args, err);
  }.bind(this);

  this.coinfalcon.delete('user/orders?id=' + order).then(success).catch(failure);
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);

  var success = function(res) {
    var parsedTrades = [];
    _.each(
      res.data,
      function(trade) {
        parsedTrades.push({
          tid: trade.id,
          date: moment(trade.created_at).unix(),
          price: parseFloat(trade.price),
          amount: parseFloat(trade.size),
        });
      },
      this
    );

    if (descending) {
      callback(null, parsedTrades);
    } else {
      callback(null, parsedTrades.reverse());
    }
  }.bind(this);

  var failure = function (err) {
    err = new Error(err);
    log.error('[CoinFalcon] error getting trades', err);
    return this.retry(this.getTrades, args, err);
  }.bind(this);

  var url = "markets/" + this.pair + "/trades"

  if (since) {
    url += '?since_time=' + (_.isString(since) ? since : since.format());
  }

  this.coinfalcon.get(url).then(success).catch(failure);
};

Trader.getCapabilities = function () {
  return {
    name: 'CoinFalcon',
    slug: 'coinfalcon',
    assets: marketData.assets,
    currencies: marketData.currencies,
    markets: marketData.markets,
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
    forceReorderDelay: false
  };
}

module.exports = Trader;
