const Kraken = require('kraken-api');
const moment = require('moment');
const _ = require('lodash');
const retry = require('../exchangeUtils').retry;

const marketData = require('./kraken-markets.json');

const Trader = function(config) {
  _.bindAll(this);

  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase()
    this.asset = config.asset.toUpperCase();
  }

  this.name = 'kraken';
  this.since = null;
  
  this.market = _.find(Trader.getCapabilities().markets, (market) => {
    return market.pair[0] === this.currency && market.pair[1] === this.asset
  });
  this.pair = this.market.book;

  this.kraken = new Kraken(
    this.key,
    this.secret,
    {timeout: +moment.duration(60, 'seconds')}
  );
}

const recoverableErrors = [
  'SOCKETTIMEDOUT',
  'TIMEDOUT',
  'CONNRESET',
  'CONNREFUSED',
  'NOTFOUND',
  'API:Rate limit exceeded',
  'Service:Unavailable',
  'Request timed out',
  'Response code 5',
  'Empty response'
];

Trader.prototype.handleResponse = function(funcName, callback) {
  return (error, body) => {

    if(!error && !body) {
      error = new Error('Empty response');
    }

    if(error) {
      console.log('error!', error);
      if(includes(error.message, recoverableErrors)) {
        console.log('is recoverable!');
        error.notFatal = true;
      }

      return callback(error);
    }

    return callback(undefined, body);
  }
};

Trader.prototype.getTrades = function(since, callback, descending) {
  const startTs = since ? moment(since).valueOf() : null;

  const handle = function(err, trades) {
    if (err) return callback(err);

    var parsedTrades = [];
    _.each(trades.result[this.pair], function(trade) {
      // Even when you supply 'since' you can still get more trades than you asked for, it needs to be filtered
      if (_.isNull(startTs) || startTs < moment.unix(trade[2]).valueOf()) {
        parsedTrades.push({
          tid: moment.unix(trade[2]).valueOf() * 1000000,
          date: parseInt(Math.round(trade[2]), 10),
          price: parseFloat(trade[0]),
          amount: parseFloat(trade[1])
        });
      }
    }, this);

    if(descending)
      callback(undefined, parsedTrades.reverse());
    else
      callback(undefined, parsedTrades);
  };

  const reqData = {
    pair: this.pair
  };

  if(since) {
    // Kraken wants a tid, which is found to be timestamp_ms * 1000000 in practice. No clear documentation on this though
    reqData.since = startTs * 1000000;
  }

  const fetch = cb => this.kraken.api('Trades', reqData, this.handleResponse('getTrades', cb));
  retry(null, fetch, handle);
};

Trader.prototype.getPortfolio = function(callback) {
  const handle = (err, data) => {
    if(err) return callback(err);

    const assetAmount = parseFloat( data.result[this.market.prefixed[1]] );
    const currencyAmount = parseFloat( data.result[this.market.prefixed[0]] );

    if(!_.isNumber(assetAmount) || _.isNaN(assetAmount)) {
      console.log(`Kraken did not return portfolio for ${this.asset}, assuming 0.`);
      assetAmount = 0;
    }

    if(!_.isNumber(currencyAmount) || _.isNaN(currencyAmount)) {
      console.log(`Kraken did not return portfolio for ${this.currency}, assuming 0.`);
      currencyAmount = 0;
    }

    const portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount }
    ];

    return callback(undefined, portfolio);
  };

  const fetch = cb => this.kraken.api('Balance', {}, this.handleResponse('getPortfolio', cb));
  retry(null, fetch, handle);
};

// This assumes that only limit orders are being placed with standard assets pairs
// It does not take into account volume discounts.
// Base maker fee is 0.16%, taker fee is 0.26%.
Trader.prototype.getFee = function(callback) {
  const makerFee = 0.16;
  callback(undefined, makerFee / 100);
};

Trader.prototype.getTicker = function(callback) {
  const fetch = (err, data) => {
    if (err) return callback(err);

    const result = data.result[this.pair];
    const ticker = {
      ask: result.a[0],
      bid: result.b[0]
    };
    callback(undefined, ticker);
  };

  const reqData = {pair: this.pair}
  const fetch = cb => this.kraken.api('Ticker', reqData, this.handleResponse('getTicker', cb));
  retry(null, fetch, handle);
};

Trader.prototype.roundAmount = function(amount) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  // Specific precision by pair https://blog.kraken.com/post/1278/announcement-reducing-price-precision-round-2

  let precision = 100000000;
  const parent = this;
  const market = Trader.getCapabilities().markets.find(function(market){ return market.pair[0] === parent.currency && market.pair[1] === parent.asset });

  if(Number.isInteger(market.precision))
    precision = Math.pow(10, market.precision);

  amount *= precision;
  amount = Math.floor(amount);
  amount /= precision;
  return amount;
};

Trader.prototype.addOrder = function(tradeType, amount, price, callback) {
  price = this.roundAmount(price); // only round price, not amount

  const handle = (err, data) => {
    if(err) return callback(err);
    
    const txid = data.result.txid[0];

    callback(undefined, txid);
  };

  const reqData = {
    pair: this.pair,
    type: tradeType.toLowerCase(),
    ordertype: 'limit',
    price: price,
    volume: amount
  };

  const fetch = cb => this.kraken.api('AddOrder', reqData, this.handleResponse('addOrder', cb));
  retry(null, fetch, handle);
};

Trader.prototype.buy = function(amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

Trader.prototype.sell = function(amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};


Trader.prototype.getOrder = function(order, callback) {
  const handle = (err, data) => {
    if(err) return callback(err);

    const price = parseFloat( data.result[ order ].price );
    const amount = parseFloat( data.result[ order ].vol_exec );
    const date = moment.unix( data.result[ order ].closetm );

    callback(undefined, {price, amount, date});
  };

  const reqData = {txid: order};

  const fetch = cb => this.kraken.api('QueryOrders', reqData, this.handleResponse('getOrder', cb));
  retry(null, fetch, handle);
}

Trader.prototype.checkOrder = function(order, callback) {
  const handle =(err, data) => {
    if(err) return callback(err);

    const result = data.result[order];
    const stillThere = result.status === 'open' || result.status === 'pending';
    callback(undefined, !stillThere);
  };

  const reqData = {txid: order};

  const fetch = cb => this.kraken.api('QueryOrders', reqData, this.handleResponse('checkOrder', cb));
  retry(null, fetch, handle);
};

Trader.prototype.cancelOrder = function(order, callback) {
  const reqData = {txid: order};

  const fetch = cb => this.kraken.api('CancelOrder', reqData, this.handleResponse('cancelOrder', cb));
  retry(null, fetch, handle);
};

Trader.getCapabilities = function () {
  return {
    name: 'Kraken',
    slug: 'kraken',
    currencies: marketData.currencies,
    assets: marketData.assets,
    markets: marketData.markets,
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'date',
    tradable: true
  };
}

module.exports = Trader;
