var Bittrex = require('node.bittrex.api');
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');
var apiKeyManager = require('../web/apiKeyManager.js');

// Helper methods
function joinCurrencies(currencyA, currencyB){
    return currencyA + '-' + currencyB;
}

var Trader = function(config) {
  _.bindAll(this);

  // not nice but works to use a web module here to grab the keys
  var keys = apiKeyManager._getApiKeyPair('bittrex');

  if(_.isObject(keys)) {
    config.key = keys.key;
    config.secret = keys.secret;
  } else {
    // no api key defined -> we need to set a dummy key, otherwise the Bittrex module will not work even for public requests
    config.key = 'sdfsdf32424dfdb'; 
    config.secret = 'sdfsdf32424dfdb';
  }

  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency;
    this.asset = config.asset;
  }

  this.name = 'Bittrex';
  this.balance;
  this.price;

  this.pair = [this.currency, this.asset].join('-');

  Bittrex.options({ 
    'apikey':  this.key, 
    'apisecret': this.secret, 
    'stream': false, 
    'verbose': false, 
    'cleartext': false 
  });

  this.logAction('Init', 'New Trader', {currency: this.currency, asset: this.asset});

  this.bittrexApi = Bittrex;
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  this.logAction('retry', 'returned an error, retrying..');

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
  this.logAction('getPortfolio', 'called');

  var set = function(data, err) {
    if(err)
      return this.retry(this.getPortfolio, args);

    data = data.result;

    var assetEntry = _.find(data, function(i) { return i.Currency == this.asset}.bind(this));
    var currencyEntry = _.find(data, function(i) { return i.Currency == this.currency}.bind(this));

    if(_.isUndefined(assetEntry)) {
      assetEntry = {
        Available: 0.0,
        Currency: this.asset
      }
    }

    if(_.isUndefined(currencyEntry)) {
      currencyEntry = {
        Available: 0.0,
        Currency: this.currency
      }
    }

    var assetAmount = parseFloat( assetEntry.Available );
    var currencyAmount = parseFloat( currencyEntry.Available );

    if(
      !_.isNumber(assetAmount) || _.isNaN(assetAmount) ||
      !_.isNumber(currencyAmount) || _.isNaN(currencyAmount)
    ) {
      log.info('asset:', this.asset);
      log.info('currency:', this.currency);
      log.info('exchange data:', data);
      util.die('Gekko was unable to set the portfolio');
    }

    var portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount }
    ];

    this.logAction('getPortfolio', 'result:', portfolio);

    callback(err, portfolio);
  }.bind(this);

  this.bittrexApi.getbalances(set);
}

Trader.prototype.getTicker = function(callback) {
  var args = _.toArray(arguments);

  this.logAction('getTicker', 'called');

  this.bittrexApi.getticker({market: this.pair}, function(data, err) {
    if(err)
      return this.retry(this.getTicker, args);

    var tick = data.result;

    this.logAction('getTicker', 'result', tick);

    callback(null, {
      bid: parseFloat(tick.Bid),
      ask: parseFloat(tick.Ask),
    })

  }.bind(this));
}

Trader.prototype.getFee = function(callback) {

  this.logAction('getFee', 'called');
  /*var set = function(data, err) {
    if(err || data.error)
      return callback(err || data.error);

    data = data.result;

    var assetEntry = _.find(data, function(c) { return c.Currency == this.asset}.bind(this));
    //var currencyEntry = _.find(data, function(c) { return c.Currency == this.currency}.bind(this));

    var fee = parseFloat(assetEntry.TxFee);

    callback(false, parseFloat(assetEntry.TxFee));
  }.bind(this);

  this.bittrexApi.getcurrencies(set); */
   
   callback(false, parseFloat(0.00025));
}

Trader.prototype.buy = function(amount, price, callback) {
  var args = _.toArray(arguments);

   this.logAction('buy', 'called');

  var set = function(result, err) {
    if(err || result.error) {
      log.error('unable to buy:', err, result);
      return this.retry(this.buy, args);
    }

    this.logAction('buy', 'result', result);

    callback(null, result.result.uuid);
  }.bind(this);

  this.bittrexApi.buylimit({market: this.pair, quantity: amount, rate: price}, set);
}

Trader.prototype.sell = function(amount, price, callback) {
  var args = _.toArray(arguments);

  this.logAction('sell', 'called');

  var set = function(result, err) {
    if(err || result.error) {
      log.error('unable to sell:', err, result);
      return this.retry(this.sell, args);
    }

   this.logAction('sell', 'result', result);

    callback(null, result.result.uuid);
  }.bind(this);

  this.bittrexApi.selllimit({market: this.pair, quantity: amount, rate: price}, set);
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(result, err) {
    this.logAction('checkOrder', 'called');

    var stillThere = _.find(result.result, function(o) { return o.OrderUuid === order });

    this.logAction('checkOrder', 'result', stillThere);
    callback(err, !stillThere);
  }.bind(this);

  this.bittrexApi.getopenorders({market: this.pair}, check);
}

Trader.prototype.getOrder = function(order, callback) {

  var get = function(result, err) {
    
    this.logAction('getOrder', 'called');

    if(err)
      return callback(err);

    var price = 0;
    var amount = 0;
    var date = moment(0);

    if(!result.success)
      return callback(null, {price, amount, date});

    var resultOrder = result.result;

    price = resultOrder.Price;
    amount = resultOrder.Quantity;

    if(resultOrder.IsOpen) {
         date = moment(resultOrder.Opened);
    } else {
       date = moment(resultOrder.Closed);
    }

    this.logAction('getOrder', 'result', {price, amount, date});
    callback(err, {price, amount, date});
  }.bind(this);

  this.bittrexApi.getorder({uuid: order}, get);
}

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(result, err) {
    this.logAction('cancelOrder', 'called', order);

    if(err || !result.success) {
      log.error('unable to cancel order', order, '(', err, result, '), retrying');
      return this.retry(this.cancelOrder, args);
    }

    this.logAction('getOrder', 'result', result);

    callback();
  }.bind(this);

  this.bittrexApi.cancel({uuid: order}, cancel);
}

Trader.prototype.getTrades = function(since, callback, descending) {

  var firstFetch = !!since;

  var args = _.toArray(arguments);
  var process = function(data, err) {
    if(err) {
      return this.retry(this.getTrades, args);
    }

    let result = data.result;

    // Edge case, see here:
    // @link https://github.com/askmike/gekko/issues/479
    if(firstFetch && _.size(result) === 50000)
      util.die(
        [
          'Poloniex did not provide enough data. Read this:',
          'https://github.com/askmike/gekko/issues/479'
        ].join('\n\n')
      );

      result = _.map(result, function(trade) {
        let mr = {
            tid: trade.Id,
            amount: +trade.Quantity,
            date: moment.utc(trade.TimeStamp).unix(),
            timeStamp: trade.TimeStamp,
            price: +trade.Price
        };
    	return mr;
    });

    callback(null, result.reverse());
  }.bind(this);

  var params = {
    currencyPair: joinCurrencies(this.currency, this.asset)
  }

  if(since)
    params.start = since.unix();

  this.bittrexApi.getmarkethistory({ market: params.currencyPair }, process);
}

Trader.getCapabilities = function () {
  return {
    name: 'bittrex',
    slug: 'bittrex',
    currencies: ['BTC', 'ETH', 'USDT'],
    assets: [
      'BTC', 'BCC','ETH','ANS','BCC'
    ],
    markets: [
      // *** BTC <-> XXX
      { pair: ['BTC', 'BCC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ANS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      
      // *** USDT <-> XXX
      { pair: ['USDT', 'BTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'BCC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'ETH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
     

      // *** ETH <-> XXX
      { pair: ['ETH', 'BCC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['ETH', 'ANS'], minimalOrder: { amount: 0.0001, unit: 'asset' } }
     

    ],
    requires: ['key', 'secret'],
    tid: 'tid',
    providesHistory: 'date',
    providesFullHistory: true,
    tradable: true
  };
}

Trader.prototype.logAction = function(method, msg, obj) {
  console.info(this.name +' ' + method + ': ' + msg);
  if(_.isObject(obj)) {
    console.info(obj);
  }
}

module.exports = Trader;
