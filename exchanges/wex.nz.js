var WEX = require('node-wex');

var moment = require('moment');
var util = require('../core/util');
var _ = require('lodash');
var log = require('../core/log')

var Trader = function(config) {
  this.key = config.key;
  this.secret = config.secret;
  this.asset = config.asset;
  this.currency = config.currency;
  this.pair = [config.asset, config.currency].join('_').toLowerCase();
  this.name = 'wex.nz';

  _.bindAll(this);

  this.wex = new WEX(this.key, this.secret);
  _.bindAll(this.wex, ['trade', 'trades', 'getInfo', 'ticker', 'orderList']);

  // see @link https://github.com/askmike/gekko/issues/302
  this.wexHistorocial = new WEX(false, false, {public_url: 'https://wex.nz/api/3/'});
  _.bindAll(this.wexHistorocial, 'trades');
}

Trader.prototype.round = function(amount) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  amount *= 100000000;
  amount = Math.floor(amount);
  amount /= 100000000;

  return amount;
}

Trader.prototype.buy = function(amount, price, callback) {
  amount = this.round(amount);

  var set = function(err, data) {
    if(err || !data || !data.return)
      return log.error('unable to buy:', err);

    callback(null, data.return.order_id);
  }.bind(this);

  // workaround for nonce error
  setTimeout(function() {
    this.wex.trade(this.pair, 'buy', price, amount, _.bind(set, this));
  }.bind(this), 1000);
}

Trader.prototype.sell = function(amount, price, callback) {
  amount = this.round(amount);

  var set = function(err, data) {
    if(err || !data || !data.return)
      return log.error('unable to sell:\n\n', err);

    callback(null, data.return.order_id);
  };

  // workaround for nonce error
  setTimeout(function() {
    this.wex.trade(this.pair, 'sell', price, amount, _.bind(set, this));
  }.bind(this), 1000);
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  var self = this;

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
}

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var calculate = function(err, data) {

    if(err) {
      if(err.message === 'invalid api key')
        util.die('Your ' + this.name + ' API keys are invalid');

      return this.retry(this.getPortfolio, args);
    }

    if(_.isEmpty(data))
      err = 'no data';

    if (err || !data.return || !data.return.funds)
      return this.retry(this.getPortfolio, args);

    var assetAmount = parseFloat( data.return.funds[this.asset.toLowerCase()] );
    var currencyAmount = parseFloat( data.return.funds[this.currency.toLowerCase()] );

    if(!_.isNumber(assetAmount) || _.isNaN(assetAmount)) {
      log.error(`wex.nz did not return portfolio for ${this.asset}, assuming 0.`);
      assetAmount = 0;
    }

    if(!_.isNumber(currencyAmount) || _.isNaN(currencyAmount)) {
      log.error(`wex.nz did not return portfolio for ${this.currency}, assuming 0.`);
      currencyAmount = 0;
    }

    var portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount }
    ];

    callback(err, portfolio);
  }.bind(this);

  this.wex.getInfo(calculate);
}

Trader.prototype.getTicker = function(callback) {
  // wex.nz doesn't state asks and bids in its
  // ticker
  var set = function(err, data) {

    if(err)
      return this.retry(this.wex.ticker, [this.pair, set]);

    var ticker = {
      ask: data.ticker.buy,
      bid: data.ticker.sell
    };

    callback(err, ticker);
  }.bind(this);

  this.wex.ticker(this.pair, set);
}

Trader.prototype.getFee = function(callback) {
  // wex.nz doesn't have different fees based on orders
  // at this moment it is always 0.2%
  callback(false, 0.002);
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {
    // wex returns an error when you have no open trades
    // right now we assume on every error that the order
    // was filled.
    //
    // TODO: check whether the error states that there are no
    // open trades or that there is something else.
    if(err)
      callback(false, true);
    else
      callback(err, !result[order]);
  }.bind(this);

  this.wex.orderList({}, check);
}

Trader.prototype.getOrder = function(orderId, callback) {
  console.log('getOrder', orderId);
  var args = _.toArray(arguments);
  var check = function(err, result) {
    if(err) {
      log.error('error on getOrder', err);
      return this.retry(this.getOrder, args);
    }

    var order = null;

    _.each(result.return, o => {
      if(o.order_id === +orderId)
        order = o;
    });

    if(!order)
      return log.error('wex.nz did not provide the order');

    var price = parseFloat(order.rate);
    var amount = parseFloat(order.amount);
    var date = moment.unix(order.timestamp);

    callback(undefined, {price, amount, date});
  }.bind(this);

  this.wex.tradeHistory({pair: this.pair}, check);
}


Trader.prototype.cancelOrder = function(order, callback) {
  this.wex.cancelOrder(order, (err, result) => {
    callback();
  });
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, trades) {
    if(err)
      return this.retry(this.getTrades, args);

    if(descending)
      callback(false, trades);
    else
      callback(false, trades.reverse());
  }.bind(this);

  // see @link https://github.com/askmike/gekko/issues/302
  if(since) {
    this.wexHistorocial.makePublicApiRequest(
      'trades',
      this.pair + '?limit=2000',
      this.processAPIv3Trades(process)
    )
  } else
    this.wex.trades(this.pair, process);
}

Trader.prototype.processAPIv3Trades = function(cb) {
  return function(err, data) {
    var trades = _.map(data[this.pair], function(t) {
      return {
        price: t.price,
        amount: t.amount,
        tid: t.tid,
        date: t.timestamp
      }
    })
    cb(err, trades);
  }.bind(this)
}

Trader.getCapabilities = function () {
  return {
    name: 'wex.nz',
    slug: 'wex.nz',
    currencies: ['USD', 'RUR', 'EUR', 'BTC', 'LTC', 'ETH', 'NMC', 'NMC', 'NVC', 'PPC', 'DSH', 'BCH'],
    assets: [
      'BTC', 'LTC', 'NMC', 'NVC', 'USD', 'EUR', 'PPC', 'DSH', 'ETH',
      'USDET', 'RURET', 'EURET', 'BTCET', 'LTCET', 'ETHET', 'NMCET', 'NVCET', 'PPCET', 'DSHET', 'BCHET' // Token
    ],
    markets: [
      { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['RUR', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['RUR', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'NMC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'NMC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'NVC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'NVC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['RUR', 'USD'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'EUR'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['RUR', 'EUR'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'PPC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'PPC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'DSH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'DSH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['RUR', 'DSH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['EUR', 'DSH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['LTC', 'DSH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['ETH', 'DSH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['EUR', 'ETH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['LTC', 'ETH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['RUR', 'ETH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'BCH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'BCH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      
      // Token pairs
      { pair: ['USD', 'USDET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['RUR', 'RURET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['EUR', 'EURET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'BTCET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['LTC', 'LTCET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['ETH', 'ETHET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['NMC', 'NMCET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['NVC', 'NVCET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['PPC', 'PPCET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['DSH', 'DSHET'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BCH', 'BCHET'], minimalOrder: { amount: 0.1, unit: 'asset' } },

    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    tid: 'tid',
    tradable: true
  };
}

module.exports = Trader;
