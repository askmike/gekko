const Luno = require("bitx");
const _ = require('lodash');
const moment = require('moment');

const Errors = require('../exchangeErrors');
const retry = require('../exchangeUtils').retry;

const name = 'Luno';

const Trader = function(config) {
  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency;
    this.asset = config.asset;
    this.pair = config.asset + config.currency;
  }
  this.luno = new Luno(this.key, this.secret, { pair: this.pair });
  this.market = _.find(Trader.getCapabilities().markets, (market) => {
    return market.pair[0] === this.currency && market.pair[1] === this.asset;
  });
  this.interval = 3000;
}

const setPrecision = (amount, digits) => {
  let precision = 100000000;
  if (Number.isInteger(digits)) precision = Math.pow(10, digits);
  amount *= precision;
  amount = Math.floor(amount);
  amount /= precision;
  return amount;
}

const round = (value, decimals = 14) => {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

const includes = (str, list) => {
  if (!_.isString(str))
    return false;

  let result = _.some(list, item => str.includes(item));
  return result;
}

const recoverableErrors = [
  'SOCKETTIMEDOUT',
  'TIMEDOUT',
  'CONNRESET',
  'CONNREFUSED',
  'NOTFOUND'
];

const processResponse = function(funcName, callback) {
  return (error, body) => {
    if (!error && !body) {
      error = new Error('Empty response');
    }

    if (error) {
      if (includes(error.message, recoverableErrors)) {
        error.notFatal = true;
      }

      if (includes(error.message, ['error 429'])) {
        error.notFatal = true;
        error.backoffDelay = 10000;
      }

      return callback(error, undefined);
    }

    return callback(undefined, body);
  }
};

//------- Gekko Functions ---------//

Trader.prototype.getTicker = function(callback) {
  const process = (err, data) => {
    if (err) {
      console.log(name, 'Error: --> ', err);
      return callback(err);
    }
    const ticker = {
      ask: data.ask,
      bid: data.bid,
      spread: round(data.ask - data.bid)
    };
    callback(undefined, ticker);
  };

  const handler = cb => this.luno.getTicker(processResponse('getTicker', cb));
  retry(null, handler, process);
}

Trader.prototype.getFee = function(callback) {
  // const process = (err, data) => {
  //   if (err) {
  //     console.log(name, 'Error: --> ', err);
  //     return callback(err);
  //   }
  //   callback(undefined, data.taker_fee / 100);
  // };
  // const handler = cb => this.luno.getFee(processResponse('getFee', cb));
  // retry(null, handler, process);

  if (this.pair === 'ETHXBT')
    callback(undefined, 0.000025);
  else if (this.pair === 'XBTIDR')
    callback(undefined, 0.00002);
  else
    callback(undefined, 0.0001);
}

Trader.prototype.getPortfolio = function(callback) {
  const process = (err, data) => {
    if (err) {
      console.log(name, 'Error: --> ', err);
      return callback(err);
    }

    let assetAmount = 0,
      currencyAmount = 0,
      assetHold = 0,
      currencyHold = 0;

    _.forEach(data.balance, (t) => {
      if (this.asset === t.asset) {
        assetAmount = +t.balance;
        assetHold = +t.reserved;
      } else if (this.currency === t.asset) {
        currencyAmount = +t.balance;
        currencyHold = +t.reserved;
      }
    });

    if (!_.isNumber(assetAmount) || _.isNaN(assetAmount) ||
        !_.isNumber(currencyAmount) || _.isNaN(currencyAmount)
    ) {
      return console.log(name, 'account balance error: Gekko is unable to trade with ', this.currency.toUpperCase(), ':', currencyAmount, ' or ', this.asset.toUpperCase(), ':', assetAmount);
    }

    const portfolio = [
      { name: this.asset.toUpperCase(), amount: round(assetAmount - assetHold) },
      { name: this.currency.toUpperCase(), amount: round(currencyAmount - currencyHold) }
    ];

    callback(err, portfolio);
  };

  const handler = cb => this.luno.getBalance(processResponse('getPortfolio', cb));
  retry(null, handler, process);
}

Trader.prototype.buy = function(amount, price, callback) {
  amount = round(amount);
  price = round(price);
  const process = (err, data) => {
    if (err) {
      console.log(name, 'unable to buy:', err.message);
      return callback(err);
    }
    callback(err, data.order_id);
  };

  const handler = cb => this.luno.postBuyOrder(amount, price, processResponse('buy', cb));
  retry(null, handler, process);
}

Trader.prototype.sell = function(amount, price, callback) {
  amount = round(amount);
  price = round(price);
  const process = (err, data) => {
    if (err) {
      console.log(name, 'unable to sell:', err.message);
      return callback(err);
    }
    callback(err, data.order_id);
  };

  const handler = cb => this.luno.postSellOrder(amount, price, processResponse('sell', cb));
  retry(null, handler, process);
}

Trader.prototype.roundAmount = function(amount) {
  amount = setPrecision(amount, this.market.precision);
  return amount;
}

Trader.prototype.roundPrice = function(price) {
  return +price;
}

Trader.prototype.getOrder = function(order, callback) {
  if (!order) {
    return callback('invalid order_id', false);
  }
  const process = (err, data) => {
    if (err) {
      console.log(name, 'Error: --> ', err);
      return callback(err);
    }
    let price = 0;
    let amount = 0;
    let date = moment();
    price = parseFloat(data.limit_price);
    amount = parseFloat(data.base);
    if (data.state === 'PENDING') {
      date = moment(data.creation_timestamp);
    } else {
      date = moment(data.completed_timestamp);
    }
    callback(err, { price, amount, date });
  };

  const handler = cb => this.luno.getOrder(order, processResponse('getOrder', cb));
  retry(null, handler, process);
}

Trader.prototype.checkOrder = function(order, callback) {
  if (!order) {
    return callback('invalid order_id');
  }
  const process = (err, data) => {
    if (err) {
      console.log(name, 'Error: --> ', err);
      return callback(err);
    }

    const result = {
      open: data.state === 'PENDING',
      executed: data.limit_volume === data.base,
      filledAmount: +data.base,
      remaining: round(+data.limit_volume - +data.base)
    }

    callback(undefined, result);
  };

  const handler = cb => this.luno.getOrder(order, processResponse('checkOrder', cb));
  retry(null, handler, process);
}

Trader.prototype.cancelOrder = function(order, callback) {
  if (!order) {
    return callback('invalid order_id');
  }
  const process = (err, data) => {
    if (err) {
      if (_.includes(err.message, 'Cannot stop unknown')) {
        console.log(name, 'unable to cancel order:', order, '(' + err.message + ') assuming success...');
        // return callback(undefined, true);
      } else {
        console.log(name, 'unable to cancel order:', order, '(' + err.message + ') aborting...');
        return callback(err);
      }
    }

    if (data && !data.success) {
      console.log('cancelOrder() --> status:', data.success);
      return callback(undefined, false);
    }

    this.checkOrder(order, (error, orderStatus) => {
      if (error) {
        console.log(name, 'cancelOrder\'s checkOrder failed. What do i do here?');
        return callback(error, false);
      }

      if (orderStatus.executed) {
        return callback(undefined, true);
      }

      // TODO: Fees?
      const remaining = {
        remaining: orderStatus.remaining,
        filled: orderStatus.filledAmount
      }

      return callback(undefined, false, remaining);
    });

  }

  const handler = cb => this.luno.stopOrder(order, processResponse('cancelOrder', cb));
  retry(null, handler, process);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  const process = (err, result) => {
    if (err) {
      console.log(name, 'Error: --> ', err);
      return callback(err);
    }
    let trades = _.map(result.trades, (t) => {
      return {
        price: t.price,
        date: Math.round(t.timestamp / 1000),
        amount: t.volume,
        tid: t.timestamp
      }
    });
    // Decending by default
    if (!descending) {
      trades = trades.reverse()
    }
    callback(undefined, trades);
  };

  if (moment.isMoment(since)) since = since.valueOf();
  (_.isNumber(since) && since > 0) ? since: since = 0;

  const options = {
    pair: this.pair,
    since: since
  }

  const handler = cb => this.luno.getTrades(options, processResponse('getTrades', cb));
  retry(null, handler, process);
}

Trader.getCapabilities = function() {
  return {
    name: 'Luno',
    slug: 'luno',
    currencies: ['MYR', 'KES', 'NGN', 'ZAR', 'XBT'],
    assets: ['ETH', 'XBT'],
    markets: [
      { pair: ['XBT', 'ETH'], minimalOrder: { amount: 0.01,   unit: 'asset' }, precision: 2 },
      { pair: ['MYR', 'XBT'], minimalOrder: { amount: 0.0005, unit: 'asset' }, precision: 6 },
      { pair: ['KES', 'XBT'], minimalOrder: { amount: 0.0005, unit: 'asset' }, precision: 6 },
      { pair: ['NGN', 'XBT'], minimalOrder: { amount: 0.0005, unit: 'asset' }, precision: 6 },
      { pair: ['ZAR', 'XBT'], minimalOrder: { amount: 0.0005, unit: 'asset' }, precision: 6 },
        ],
    requires: ['key', 'secret'],
    providesFullHistory: true,
    providesHistory: 'date',
    // maxHistoryFetch: 100,
    tid: 'tid',
    tradable: true,
    forceReorderDelay: true,
    gekkoBroker: 0.6
  };
}

module.exports = Trader;
