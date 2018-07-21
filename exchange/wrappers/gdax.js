const Gdax = require('gdax');
const _ = require('lodash');
const moment = require('moment');

const errors = require('../exchangeErrors');
const retry = require('../exchangeUtils').retry;

const BATCH_SIZE = 100;
const QUERY_DELAY = 350;

const Trader = function(config) {
  this.post_only = true;
  this.use_sandbox = false;
  this.name = 'GDAX';
  this.scanback = false;
  this.scanbackTid = 0;
  this.scanbackResults = [];
  this.asset = config.asset;
  this.currency = config.currency;

  this.api_url = 'https://api.gdax.com';
  this.api_sandbox_url = 'https://api-public.sandbox.gdax.com';

  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.passphrase = config.passphrase;

    this.pair = [config.asset, config.currency].join('-').toUpperCase();
    this.post_only =
      typeof config.post_only !== 'undefined' ? config.post_only : true;
    
    if (config.sandbox) {
      this.use_sandbox = config.sandbox;
    }

  }

  this.gdax_public = new Gdax.PublicClient(
    this.use_sandbox ? this.api_sandbox_url : undefined
  );
  this.gdax = new Gdax.AuthenticatedClient(
    this.key,
    this.secret,
    this.passphrase,
    this.use_sandbox ? this.api_sandbox_url : undefined
  );
};

const recoverableErrors = [
  'SOCKETTIMEDOUT',
  'TIMEDOUT',
  'CONNRESET',
  'CONNREFUSED',
  'NOTFOUND',
  'Rate limit exceeded',
  'Response code 5',
  'GDAX is currently under maintenance.',
  'HTTP 408 Error',
  'HTTP 504 Error',
  'HTTP 503 Error',
  'socket hang up',
  'EHOSTUNREACH'
];

const includes = (str, list) => {
  if(!_.isString(str))
    return false;

  return _.some(list, item => str.includes(item));
}

Trader.prototype.processResponse = function(method, next) {
  return (error, response, body) => {
    if(!error && body && !_.isEmpty(body.message)) {
      error = new Error(body.message);
    }

    if(
      response &&
      response.statusCode < 200 &&
      response.statusCode >= 300
    ) {
      error = new Error(`Response code ${response.statusCode}`);
    }

    if(error) {
      if(includes(error.message, recoverableErrors)) {
        error.notFatal = true;
      }

      if(
        ['buy', 'sell'].includes(method) &&
        error.message.includes('Insufficient funds')
      ) {
        error.retry = 10;
      }

      console.log(error.message);

      return next(error);
    }

    return next(undefined, body);
  }
}

Trader.prototype.getPortfolio = function(callback) {
  const result = (err, data) => {
    if (err) return callback(err);

    var portfolio = data.map(function(account) {
      return {
        name: account.currency.toUpperCase(),
        amount: parseFloat(account.available),
      };
    });
    callback(undefined, portfolio);
  };

  const fetch = cb =>
    this.gdax.getAccounts(this.processResponse('getPortfolio', cb));
  retry(null, fetch, result);
};

Trader.prototype.getTicker = function(callback) {
  const result = (err, data) => {
    if (err) return callback(err);
    callback(undefined, { bid: +data.bid, ask: +data.ask });
  };

  const fetch = cb =>
    this.gdax_public.getProductTicker(this.pair, this.processResponse('getTicker', cb));
  retry(null, fetch, result);
};

Trader.prototype.getFee = function(callback) {
  //https://www.gdax.com/fees
  // const fee = this.asset == 'BTC' ? 0.0025 : 0.003;
  const fee = 0;

  //There is no maker fee, not sure if we need taker fee here
  //If post only is enabled, gdax only does maker trades which are free
  callback(undefined, this.post_only ? 0 : fee);
};

Trader.prototype.roundPrice = function(price) {
  return this.getMaxDecimalsNumber(price, this.currency == 'BTC' ? 5 : 2);
}

Trader.prototype.roundAmount = function(amount) {
  return this.getMaxDecimalsNumber(amount);
}

Trader.prototype.buy = function(amount, price, callback) {
  const buyParams = {
    price: this.getMaxDecimalsNumber(price, this.currency == 'BTC' ? 5 : 2),
    size: this.getMaxDecimalsNumber(amount),
    product_id: this.pair,
    post_only: this.post_only,
  };

  const result = (err, data) => {
    if (err) {
      console.log({buyParams}, err.message);
      return callback(err);
    }
    callback(undefined, data.id);
  };

  const fetch = cb =>
    this.gdax.buy(buyParams, this.processResponse('buy', cb));
  retry(null, fetch, result);
};

Trader.prototype.sell = function(amount, price, callback) {
  const sellParams = {
    price: this.getMaxDecimalsNumber(price, this.currency == 'BTC' ? 5 : 2),
    size: this.getMaxDecimalsNumber(amount),
    product_id: this.pair,
    post_only: this.post_only,
  };

  const result = (err, data) => {
    if (err) {
      console.log({sellParams}, err.message);
      return callback(err);
    }

    if(data.message && data.message.includes('Insufficient funds')) {
      err = new Error(data.message);
      err.retryOnce = true;
      return callback(err);
    }

    callback(undefined, data.id);
  };

  const fetch = cb =>
    this.gdax.sell(sellParams, this.processResponse('sell', cb));
  retry(null, fetch, result);
};

Trader.prototype.checkOrder = function(order, callback) {
  const result = (err, data) => {
    if (err) return callback(err);

    // @link:
    // https://stackoverflow.com/questions/48132078/available-gdax-order-statuses-and-meanings
    var status = data.status;
    if(status == 'pending') {
      // technically not open yet, but will be soon
      return callback(undefined, { executed: false, open: true, filledAmount: 0 });
    } if (status === 'done' || status === 'settled') {
      return callback(undefined, { executed: true, open: false });
    } else if (status === 'rejected') {
      return callback(undefined, { executed: false, open: false });
    } else if(status === 'open' || status === 'active') {
      return callback(undefined, { executed: false, open: true, filledAmount: parseFloat(data.filled_size) });
    }

    callback(new Error('Unknown status ' + status));
  };

  const fetch = cb =>
    this.gdax.getOrder(order, this.processResponse('checkOrder', cb));
  retry(null, fetch, result);
};

Trader.prototype.getOrder = function(order, callback) {
  const result = (err, data) => {
    if (err) return callback(err);

    const price = parseFloat(data.price);
    const amount = parseFloat(data.filled_size);
    const date = moment(data.done_at);
    const fees = {
      // you always pay fee in the base currency on gdax
      [this.currency]: +data.fill_fees
    }
    const feePercent = +data.fill_fees / price / amount * 100;

    callback(undefined, { price, amount, date, fees, feePercent });
  };

  const fetch = cb =>
    this.gdax.getOrder(order, this.processResponse('getOrder', cb));
  retry(null, fetch, result);
};

Trader.prototype.cancelOrder = function(order, callback) {
  // callback for cancelOrder should be true if the order was already filled, otherwise false
  const result = (err, data) => {
    if(err) {
      return callback(null, true);  // need to catch the specific error but usually an error on cancel means it was filled
    }

    return callback(null, false);
  };

  const fetch = cb =>
    this.gdax.cancelOrder(order, this.processResponse('cancelOrder', cb));
  retry(null, fetch, result);
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var lastScan = 0;

  const handle = function(err, data) {
    if (err) return callback(err);

    var result = _.map(data, function(trade) {
      return {
        tid: trade.trade_id,
        amount: parseFloat(trade.size),
        date: moment.utc(trade.time).format('X'),
        price: parseFloat(trade.price),
      };
    });

    if (this.scanback) {
      var last = _.last(data);
      var first = _.first(data);

      // Try to find trade id matching the since date
      if (!this.scanbackTid) {
        // either scan for new ones or we found it.
        if (moment.utc(last.time) < moment.utc(since)) {
          this.scanbackTid = last.trade_id;
        } else {
          console.log('Scanning backwards...' + last.time);
          setTimeout(() => {
            let handler = cb =>
              this.gdax_public.getProductTrades(
                this.pair,
                {
                  after: last.trade_id - BATCH_SIZE * lastScan,
                  limit: BATCH_SIZE,
                },
                this.processResponse('getTrades', cb)
              );
            retry(
              retryForever,
              _.bind(handler, this),
              _.bind(process, this)
            );
          }, QUERY_DELAY);
          lastScan++;
          if (lastScan > 100) {
            lastScan = 10;
          }
        }
      }

      if (this.scanbackTid) {
        // if scanbackTid is set we need to move forward again
        console.log(
          'Backwards: ' +
            last.time +
            ' (' +
            last.trade_id +
            ') to ' +
            first.time +
            ' (' +
            first.trade_id +
            ')'
        );

        this.scanbackResults = this.scanbackResults.concat(result.reverse());

        if (this.scanbackTid != first.trade_id) {
          this.scanbackTid = first.trade_id;
          setTimeout(() => {
            let handler = cb =>
              this.gdax_public.getProductTrades(
                this.pair,
                { after: this.scanbackTid + BATCH_SIZE + 1, limit: BATCH_SIZE },
                this.processResponse('getTrades', cb)
              );
            retry(
              retryForever,
              _.bind(handler, this),
              _.bind(process, this)
            );
          }, QUERY_DELAY);
        } else {
          this.scanback = false;
          this.scanbackTid = 0;

          console.log('Scan finished: data found:' + this.scanbackResults.length);
          callback(null, this.scanbackResults);

          this.scanbackResults = [];
        }
      }
    } else {
      callback(null, result.reverse());
    }
  };

  if (since || this.scanback) {
    this.scanback = true;
    if (this.scanbackTid) {
      let handler = cb =>
        this.gdax_public.getProductTrades(
          this.pair,
          { after: this.scanbackTid + BATCH_SIZE + 1, limit: BATCH_SIZE },
          this.processResponse('getTrades', cb)
        );
      retry(
        retryForever,
        _.bind(handler, this),
        _.bind(process, this)
      );
    } else {
      console.log('Scanning back in the history needed...', since);
    }
  }

  const fetch = cb =>
    this.gdax_public.getProductTrades(
      this.pair,
      { limit: BATCH_SIZE },
      this.processResponse('getTrades', cb)
    );
  retry(null, fetch, handle);
};

Trader.prototype.getMaxDecimalsNumber = function(number, decimalLimit = 8) {
  var decimalNumber = parseFloat(number);

  // The ^-?\d*\. strips off any sign, integer portion, and decimal point
  // leaving only the decimal fraction.
  // The 0+$ strips off any trailing zeroes.
  var decimalCount = (+decimalNumber).toString().replace(/^-?\d*\.?|0+$/g, '')
    .length;

  var decimalMultiplier = 1;
  for (i = 0; i < decimalLimit; i++) {
    decimalMultiplier *= 10;
  }

  return decimalCount <= decimalLimit
    ? decimalNumber.toString()
    : (
        Math.floor(decimalNumber * decimalMultiplier) / decimalMultiplier
      ).toFixed(decimalLimit);
};

Trader.getCapabilities = function() {
  return {
    name: 'GDAX',
    slug: 'gdax',
    currencies: ['USD', 'EUR', 'GBP', 'BTC'],
    assets: ['BTC', 'LTC', 'ETH', 'BCH'],
    markets: [
      { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['USD', 'BCH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['EUR', 'ETH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'BCH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['GBP', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'BCH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
    ],
    requires: ['key', 'secret', 'passphrase'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
    forceReorderDelay: false,
    gekkoBroker: 0.6
  };
};

module.exports = Trader;
