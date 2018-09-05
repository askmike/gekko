const Poloniex = require("gekko-broker-poloniex");
const _ = require('lodash');
const moment = require('moment');
const retry = require('../exchangeUtils').retry;
const marketData = require('./poloniex-markets.json');

const Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency;
    this.asset = config.asset;
  }
  this.name = 'Poloniex';
  this.balance;
  this.price;

  this.pair = this.currency + '_' + this.asset;

  this.poloniex = new Poloniex({
    key: this.key,
    secret: this.secret,
    userAgent: 'Gekko Broker v' + require('../package.json').version
  });
}

const recoverableErrors = [
  'SOCKETTIMEDOUT',
  'TIMEDOUT',
  'CONNRESET',
  'CONNREFUSED',
  'NOTFOUND',
  '429',
  '522',
  '504',
  '503',
  '500',
  '502',
  'socket hang up',
  'Empty response',
  'Please try again in a few minutes.',
  'Nonce must be greater than',
  'Internal error. Please try again.',
  'Connection timed out. Please try again.',
  // getaddrinfo EAI_AGAIN poloniex.com poloniex.com:443
  'EAI_AGAIN',
  'ENETUNREACH'
];

// errors that might mean
// the API call succeeded.
const unknownResultErrors = [
  'ETIMEDOUT',
]

const includes = (str, list) => {
  if(!_.isString(str))
    return false;

  return _.some(list, item => str.includes(item));
}

Trader.prototype.processResponse = function(next, fn, payload) {
  // TODO: in very rare cases the callback is
  // called twice (first on ETIMEDOUT later
  // without error). Temp workaround.
  next = _.once(next);

  return (err, data) => {
    let error;

    if(err) {
      if(err.message) {
        error = err;
      } else {
        console.log('err but no message,', typeof err, {err, data});
        error = new Error(err);
      }
    } else if(!data) {
      error = new Error('Empty response');
    } else if(data.error) {
      error = new Error(data.error);
    } else if(includes(data, ['Please complete the security check to proceed.'])) {
      error = new Error(
        'Your IP has been flagged by CloudFlare. ' +
        'As such Gekko Broker cannot access Poloniex.'
      );
      data = undefined;
    } else if(includes(data, ['Please try again in a few minutes.'])) {
      error = new Error('Please try again in a few minutes.');
      error.notFatal = true;
      data = undefined;
    } else if(includes(data, ['<!DOCTYPE html>'])) {
      error = new Error(data);
      data = undefined;
    }

    if(error) {

      if(includes(error.message, recoverableErrors)) {
        error.notFatal = true;
      }

      // not actually an error, means order never executed against other trades
      if(fn === 'getOrder' &&
        error.message.includes('Order not found, or you are not the person who placed it.')
      ) {
        error = undefined;
        data = { unfilled: true };
        console.log(new Date, 'UNKNOWN ORDER!', payload);
      }

      if(fn === 'cancelOrder') {

        // already filled
        if(includes(error.message, ['Invalid order number, or you are not the person who placed the order.'])) {
          console.log(new Date, 'cancelOrder invalid order');
          error = undefined;
          data = { filled: true };
        }

        // it might be cancelled
        else if(includes(error.message, unknownResultErrors)) {
          setTimeout(() => {
            this.getRawOpenOrders((err, orders) => {
              if(err) {
                return next(err);
              }

              const order = _.find(orders, o => o.orderNumber == payload);

              // the cancel did not work since the order still exists
              if(order) {
                error.notFatal = true;
                return next(error);
              }

              // it was cancelled, we need to check filled amount..
              console.log(new Date, '[CANCELFIX] process cancel response');
              console.log('[CANCELFIX] rechecking fill')
              setTimeout(() => {
                this.getOrder(payload, (error, order) => {
                  if(error) {
                    return next(error)
                  }

                  console.log('[CANCELFIX] checked, got:', order);

                  return next(undefined, { filled: order.amount });
                });
              }, this.checkInterval);
            });

          }, this.checkInterval);
          return;
        }
      }

      if(fn === 'order') {
        if(includes(error.message, ['Not enough'])) {
          error.retry = 2;
        }

        // we need to check whether the order was actually created
        if(includes(error.message, unknownResultErrors)) {
          return setTimeout(() => {
            this.findLastOrder(10, payload, (err, lastTrade) => {
              if(lastTrade) {
                return next(undefined, lastTrade);
              }

              next(error);
            });

          }, this.checkInterval);
        }
      }
    }

    return next(error, data);
  }
}

Trader.prototype.findLastOrder = function(since, side, callback) {
  const handle = (err, result) => {
    if(err) {
      return callback(err);
    }

    result = result.filter(t => t.type === side);

    if(!result.length) {
      return callback(undefined, undefined);
    }

    let order;
    if(since) {
      const threshold = moment().subtract(since, 'm');
      order = _.find(result, o => moment.utc(o.date) > threshold);
    } else {
      order = _.last(result);
    }

    callback(undefined, order);
  };

  this.getRawOpenOrders(handle);
}

Trader.prototype.getRawOpenOrders = function(callback) {
  const fetch = next => this.poloniex.returnOpenOrders(this.currency, this.asset, this.processResponse(next));
  retry(null, fetch, callback);
}

Trader.prototype.getOpenOrders = function(callback) {
  this.getRawOpenOrders((err, orders) => {
    if(err) {
      return callback(err);
    }

    const ids = orders.map(o => o.orderNumber);

    return callback(undefined, ids);
  })
}

Trader.prototype.getPortfolio = function(callback) {
  const handle = (err, data) => {
    if(err) {
      return callback(err);
    }

    var assetAmount = parseFloat( data[this.asset] );
    var currencyAmount = parseFloat( data[this.currency] );

    if(
      !_.isNumber(assetAmount) || _.isNaN(assetAmount) ||
      !_.isNumber(currencyAmount) || _.isNaN(currencyAmount)
    ) {
      assetAmount = 0;
      currencyAmount = 0;
    }

    var portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount }
    ];

    callback(undefined, portfolio);
  }

  const fetch = next => this.poloniex.myBalances(this.processResponse(next));
  retry(null, fetch, handle);
}

Trader.prototype.getTicker = function(callback) {
  const handle = (err, data) => {
    if(err)
      return callback(err);

    var tick = data[this.pair];

    callback(null, {
      bid: parseFloat(tick.highestBid),
      ask: parseFloat(tick.lowestAsk),
    });
  };


  const fetch = next => this.poloniex.getTicker(this.processResponse(next));
  retry(null, fetch, handle);
}

Trader.prototype.getFee = function(callback) {
  const handle = (err, data) => {
    if(err)
      return callback(err);

    callback(undefined, parseFloat(data.makerFee));
  }

  const fetch = next => this.poloniex._private('returnFeeInfo', this.processResponse(next));
  retry(null, fetch, handle);
}

Trader.prototype.roundAmount = function(amount) {
  return _.floor(amount, 8);
}

Trader.prototype.roundPrice = function(price) {
  return +price;
}

Trader.prototype.isValidLot = function(price, amount) {
  // Error: Total must be at least 0.0001.
  return amount * price >= 0.0001;
}

Trader.prototype.createOrder = function(side, amount, price, callback) {
  const handle = (err, result) => {
    if(err) {
      console.log('createOrder', {side, amount, price});
      return callback(err);
    }

    callback(undefined, result.orderNumber);
  }

  const fetch = next => {
    this.poloniex[side](this.currency, this.asset, price, amount, this.processResponse(next, 'order', side))
  };
  retry(null, fetch, handle);  
}

Trader.prototype.buy = function(amount, price, callback) {
  this.createOrder('buy', amount, price, callback);
}

Trader.prototype.sell = function(amount, price, callback) {
  this.createOrder('sell', amount, price, callback);
}

Trader.prototype.checkOrder = function(id, callback) {
  const handle = (err, result) => {

    if(err) {
      return callback(err);
    }

    if(result.completed) {
      return callback(undefined, { executed: true, open: false });
    }

    const order = _.find(result, function(o) { return o.orderNumber === id });
    if(!order) {
      // if the order is not open it's fully executed
      return callback(undefined, { executed: true, open: false });
    }

    callback(undefined, { executed: false, open: true, filledAmount: order.startingAmount - order.amount });
  }

  const fetch = next => this.poloniex.myOpenOrders(this.currency, this.asset, this.processResponse(next, 'checkOrder'));
  retry(null, fetch, handle);
}

Trader.prototype.getOrder = function(order, callback) {
  const handle = (err, result) => {
    if(err)
      return callback(err);

    let price = 0;
    let amount = 0;
    let date = moment(0);

    if(result.unfilled) {
      return callback(null, {price, amount, date});
    }

    _.each(result, trade => {
      date = moment(trade.date);
      price = ((price * amount) + (+trade.rate * trade.amount)) / (+trade.amount + amount);
      amount += +trade.amount;
    });

    const fees = {};
    const feePercent = _.first(result).fee * 100;

    if(_.first(result).type === 'sell') {
      const fee = price * amount * _.first(result).fee;
      fees[this.currency] = fee;
    } else {
      const fee = amount * _.first(result).fee;
      fees[this.asset] = fee;
    }

    callback(err, {price, amount, date, fees, feePercent});
  };

  const fetch = next => this.poloniex.returnOrderTrades(order, this.processResponse(next, 'getOrder', order));
  retry(null, fetch, handle);
}

Trader.prototype.cancelOrder = function(order, callback) {
  const handle = (err, result) => {
    if(err) {
      return callback(err);
    }

    if(result.filled) {
      return callback(undefined, true);
    }

    let data;

    if(result.amount) {
      data = { remaining: result.amount };
    }


    callback(undefined, false, data);
  };
  
  const fetch = next => this.poloniex.cancelOrder(this.currency, this.asset, order, this.processResponse(next, 'cancelOrder', order));
  retry(null, fetch, handle);
}

Trader.prototype.getTrades = function(since, callback, descending) {

  const firstFetch = !!since;
  const args = _.toArray(arguments);

  const handle = (err, result) => {
    if(err)
      return callback(err);

    // Edge case, see here:
    // @link https://github.com/askmike/gekko/issues/479
    if(firstFetch && _.size(result) === 50000)
      return callback(
        [
          'Poloniex did not provide enough data. Read this:',
          'https://github.com/askmike/gekko/issues/479'
        ].join('\n\n')
      );

    result = _.map(result, function(trade) {
      return {
        tid: trade.tradeID,
        amount: +trade.amount,
        date: moment.utc(trade.date).unix(),
        price: +trade.rate
      };
    });

    callback(null, result.reverse());
  };

  var params = {
    currencyPair: this.pair
  }

  if(since)
    params.start = since.unix();

  const fetch = next => this.poloniex._public('returnTradeHistory', params, this.processResponse(next, 'getTrades', since));
  retry(null, fetch, handle);
}

Trader.getCapabilities = function () {
	return {
		name: 'Poloniex',
		slug: 'poloniex',
		currencies: marketData.currencies,
		assets: marketData.assets,
		markets: marketData.markets,
		currencyMinimums: {BTC: 0.0001, ETH: 0.0001, XMR: 0.0001, USDT: 1.0},
		requires: ['key', 'secret'],
		tid: 'tid',
		providesHistory: 'date',
		providesFullHistory: true,
		tradable: true,
    gekkoBroker: 0.6
	};
}

module.exports = Trader;
