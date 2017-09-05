var Kraken = require('kraken-api-es5');
var moment = require('moment');
var util = require('../core/util');
var _ = require('lodash');
var log = require('../core/log');

var crypto_currencies = [
  "XBT",
  "DASH",
  "EOS",
  "ETC",
  "ETH",
  "GNO",
  "ICN",
  "LTC",
  "MLN",
  "REP",
  "USDT",
  "XDG",
  "XLM",
  "XMR",
  "XRP",
  "ZEC"
];

var fiat_currencies = [
  "EUR",
  "GBP",
  "USD",
  "JPY",
  "CAD",

];

// Method to check if asset/currency is a crypto currency
var isCrypto = function(value) {
  return _.contains(crypto_currencies, value);
};

// Method to check if asset/currency is a fiat currency
var isFiat = function(value) {
  return _.contains(fiat_currencies, value);
};

var addPrefix = function(value) {

  var fiatPrefix = "Z";
  var cryptoPrefix = "X";

  if(isFiat(value))
    return fiatPrefix + value;
  else if(isCrypto(value))
    return cryptoPrefix + value;
  else
    return value;
}

var Trader = function(config) {
  _.bindAll(this);

  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase()
    this.asset = config.asset.toUpperCase();
  }

  // We need to prefix the asset and currency
  // with either Z or X on all markets.
  // EXCEPT for BCH markets..
  if(this.asset === 'BCH')
    this.pair = this.asset + this.currency;
  else
    this.pair = addPrefix(this.asset) + addPrefix(this.currency);
  this.name = 'kraken';
  this.since = null;

  this.kraken = new Kraken(
    this.key,
    this.secret,
    {timeout: +moment.duration(60, 'seconds')}
  );
}

Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(5, 'seconds');
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
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, trades) {
    if (err || !trades || trades.length === 0) {
      log.error('error getting trades', err);
      return this.retry(this.getTrades, args);
    }

    var parsedTrades = [];
    _.each(trades.result[this.pair], function(trade) {
      parsedTrades.push({
        date: parseInt(Math.round(trade[2]), 10),
        price: parseFloat(trade[0]),
        amount: parseFloat(trade[1])
      });
    }, this);

    if(descending)
      callback(null, parsedTrades.reverse());
    else
      callback(null, parsedTrades);
  };

  var reqData = {
    pair: this.pair
  };
  // This appears to not work correctly
  // skipping for now so we have the same
  // behaviour cross exchange.
  //
  // if(!_.isNull(this.since))
  //   reqData.since = this.since;
  this.kraken.api('Trades', reqData, _.bind(process, this));
};

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var set = function(err, data) {

    if(_.isEmpty(data))
      err = 'no data';

    else if(!_.isEmpty(data.error))
      err = data.error;

    if (err || !data.result) {
      log.error(err);
      return this.retry(this.getPortfolio, args);
    }

    var assetAmount = parseFloat( data.result[addPrefix(this.asset)] );
    var currencyAmount = parseFloat( data.result[addPrefix(this.currency)] );

    if(!_.isNumber(assetAmount) || _.isNaN(assetAmount)) {
      log.error(`Kraken did not return portfolio for ${this.asset}, assuming 0.`);
      assetAmount = 0;
    }

    if(!_.isNumber(currencyAmount) || _.isNaN(currencyAmount)) {
      log.error(`Kraken did not return portfolio for ${this.currency}, assuming 0.`);
      currencyAmount = 0;
    }

    var portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount }
    ];
    callback(err, portfolio);
  };

  this.kraken.api('Balance', {}, _.bind(set, this));
};

Trader.prototype.getFee = function(callback) {
  callback(false, 0.002);
};

Trader.prototype.getTicker = function(callback) {
  var set = function(err, data) {

    if(!err && _.isEmpty(data))
      err = 'no data';

    else if(!err && !_.isEmpty(data.error))
      err = data.error;

    if (err)
      return log.error('unable to get ticker', JSON.stringify(err));

    var result = data.result[this.pair];
    var ticker = {
      ask: result.a[0],
      bid: result.b[0]
    };
    callback(err, ticker);
  };

  this.kraken.api('Ticker', {pair: this.pair}, _.bind(set, this));
};

Trader.prototype.roundAmount = function(amount) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  // Specific precision by pair https://blog.kraken.com/post/1278/announcement-reducing-price-precision-round-2

  var precision = 100000000;
  var market = this.getCapabilities().markets.find(function(market){ return market.pair[0] === this.currency && market.pair[1] === this.asset });

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

    // console.log('blap', err, data);

    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.error))
      err = data.error;

    if(err) {
      log.error('unable to ' + tradeType.toLowerCase(), err);
      return this.retry(this.addOrder, args);
    }

    var txid = data.result.txid[0];
    log.debug('added order with txid:', txid);

    callback(undefined, txid);
  };

  this.kraken.api('AddOrder', {
    pair: this.pair,
    type: tradeType.toLowerCase(),
    ordertype: 'limit',
    price: price,
    volume: amount.toString()
  }, _.bind(set, this));
};


Trader.prototype.getOrder = function(order, callback) {

  var get = function(err, data) {
    if(!err && _.isEmpty(data) && _.isEmpty(data.result))
      err = 'no data';

    else if(!err && !_.isEmpty(data.error))
      err = data.error;

    if(err)
      return log.error('Unable to get order', order, JSON.stringify(err));

    var price = parseFloat( data.result[ order ].price );
    var amount = parseFloat( data.result[ order ].vol_exec );
    var date = moment.unix( data.result[ order ].closetm );

    callback(undefined, {price, amount, date});
  }.bind(this);

  this.kraken.api('QueryOrders', {txid: order}, get);
}

Trader.prototype.buy = function(amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

Trader.prototype.sell = function(amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, data) {
    if(_.isEmpty(data))
      err = 'no data';

    if(!_.isEmpty(data.error))
      err = data.error;

    if(err)
      return log.error('Unable to check order', order, JSON.stringify(err));

    var result = data.result[order];
    var stillThere = result.status === 'open' || result.status === 'pending';
    callback(err, !stillThere);
  };

  this.kraken.api('QueryOrders', {txid: order}, _.bind(check, this));
};

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(err, data) {
    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.error))
      err = data.error;

    if(err) {
      log.error('unable to cancel order', order, '(', err, JSON.stringify(err), ')');
      return this.retry(this.cancelOrder, args);
    }

    callback();
  };

  this.kraken.api('CancelOrder', {txid: order}, _.bind(cancel, this));
};

Trader.getCapabilities = function () {
  return {
    name: 'Kraken',
    slug: 'kraken',
    currencies: ['CAD', 'EUR', 'GBP', 'JPY', 'USD', 'XBT'],
    assets: ['XBT', 'LTC', 'GNO', 'ICN', 'MLN', 'REP', 'XDG', 'XLM', 'XMR', 'XRP', 'ZEC', 'ETH', 'BCH', 'DASH', 'EOS', 'ETC'],
    markets: [
      //Tradeable againt ETH
      { pair: ['XBT', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['CAD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['EUR', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['GBP', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['JPY', 'ETH'], minimalOrder: { amount: 1, unit: 'asset' }, precision: 0 },
      { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['EOS', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['ETC', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['GNO', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 4 },
      { pair: ['ICN', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['MLN', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['REP', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against LTC
      { pair: ['XBT', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },


      //Tradeable against BCH
      { pair: ['USD', 'BCH'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },
      { pair: ['EUR', 'BCH'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },
      { pair: ['XBT', 'BCH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against DASH
      { pair: ['USD', 'DASH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['EUR', 'DASH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['XBT', 'DASH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against EOS
      { pair: ['USD', 'EOS'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'EOS'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XBT', 'EOS'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 7 },
      { pair: ['ETH', 'EOS'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },

      //Tradeable against ETC
      { pair: ['USD', 'ETC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 3 },
      { pair: ['EUR', 'ETC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 3 },
      { pair: ['XBT', 'ETC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['ETH', 'ETC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against GNO
      { pair: ['USD', 'GNO'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'GNO'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XBT', 'GNO'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['ETH', 'GNO'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 4 },

      //Tradeable against ICN
      { pair: ['XBT', 'ICN'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 7 },
      { pair: ['ETH', 'ICN'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },

      //Tradeable against MLN
      { pair: ['XBT', 'MLN'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['ETH', 'MLN'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against REP
      { pair: ['USD', 'REP'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'REP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 3 },
      { pair: ['XBT', 'REP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['ETH', 'REP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },


      //Tradeable against XDG
      { pair: ['XBT', 'XDG'], minimalOrder: { amount: 0.01, unit: 'asset' } },

      //Tradeable against XLM
      { pair: ['USD', 'XLM'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'XLM'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XBT', 'XLM'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 8 },

      //Tradeable against XMR
      { pair: ['USD', 'XMR'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['EUR', 'XMR'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['XBT', 'XMR'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },


      //Tradeable against XRP
      { pair: ['USD', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['EUR', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['XBT', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 8 },
      { pair: ['CAD', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['JPY', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' } },

      //Tradeable against ZEC
      { pair: ['USD', 'ZEC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['EUR', 'ZEC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['XBT', 'ZEC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against XBT
      { pair: ['BCH', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['LTC', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['XDG', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XLM', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XRP', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['CAD', 'XBT'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },
      { pair: ['EUR', 'XBT'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },
      { pair: ['GBP', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['JPY', 'XBT'], minimalOrder: { amount: 1, unit: 'asset' }, precision: 0 },
      { pair: ['USD', 'XBT'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },
      { pair: ['DASH', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['EOS', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 7 },
      { pair: ['ETC', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['ETH', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['GNO', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['ICN', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 7 },
      { pair: ['MLN', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['REP', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XDG', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XLM', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 8 },
      { pair: ['XMR', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['XRP', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 8 },
      { pair: ['ZEC', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    tid: 'date',
    tradable: true
  };
}

module.exports = Trader;
