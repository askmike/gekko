var Bitcoincoid = require('bitcoin-co-id'),
   _ = require('lodash'),
   moment = require('moment'),
   log = require('../core/log');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.clientID = config.username;
    this.currency = config.currency.toLowerCase();
    this.asset = config.asset.toLowerCase();
    this.pair = this.asset + '_' + this.currency;
  }
  this.name = 'Bitcoin-co-id';
  this.bitcoincoid = new Bitcoincoid(this.key, this.secret);
}

Trader.prototype.roundAmount = function(amount) {

  var priceDivider = 100000000; // one hundred million;
  amount *= priceDivider;
  amount = Math.floor(amount);
  amount /= priceDivider;
  return amount;
};

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

Trader.prototype.getTicker = function(callback) {
  var args = _.toArray(arguments),
  set = function(err, data) {
    if(err)
      return this.retry(this.getTicker, args);
      var ticker = {
      ask: this.roundAmount(data.ticker.buy),
      bid: this.roundAmount(data.ticker.sell),
    };
    callback(err, ticker);
  }.bind(this);
  this.bitcoincoid.getTicker(this.pair, set);
}

Trader.prototype.getPortfolio = function(callback) {
  var functionName = 'Trader.getPortfolio()',
  args = _.toArray(arguments);
  set = function(err, data) {
    if(err)
      return this.retry(this.getPortfolio, args);
    var assetAmount = this.roundAmount( data.return.balance[this.asset] ),
    currencyAmount = this.roundAmount( data.return.balance[this.currency] ),
    assetHold = this.roundAmount( data.return.balance_hold[this.asset] ),
    currencyHold = this.roundAmount( data.return.balance_hold[this.currency] );

    if(
      !_.isNumber(assetAmount) || _.isNaN(assetAmount) ||
      !_.isNumber(currencyAmount) || _.isNaN(currencyAmount)
    ) {
      return log.error('account balance error: Gekko is unable to trade with ',this.currency.toUpperCase(),':',currencyAmount,' or ',this.asset.toUpperCase(),':',assetAmount);
    }
    var portfolio = [
      { name: this.currency.toUpperCase(), amount: currencyAmount - currencyHold},
      { name: this.asset.toUpperCase(), amount: assetAmount - assetHold }
    ];
    callback(err, portfolio);
  }.bind(this);
  this.bitcoincoid.getAccountBalances(set);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);

  if(since)
      since = 150 //???;

  var process = function(err, data) {
    if(err)
      return this.retry(this.getTrades, args);
  
    var trades = _.map(data, function(trade) {
      return {
         price: +trade.price,
         amount: +trade.amount,
         tid: +trade.tid,
         date: trade.date
       }
    });
    callback(null, data.reverse());
  }.bind(this);

  this.bitcoincoid.getTrades(this.pair, process);
}

// bitcoin.co.id: Maker 0% - Taker 0.3%
// Note: trading fee: 0.3% for IDR pairs and 0% for BTC pairs
Trader.prototype.getFee = function(callback) {

  if (this.currency.toUpperCase() === 'IDR')
    {
       var fee = 0.003;
    }
    else if (this.currency.toUpperCase() === 'BTC')
    {
       var fee = 0.000;;
    }

  callback(false, fee);
};

Trader.prototype.buy = function(amount, price, callback) {
  this.type = 'buy';

  // decrease purchase by 1% to avoid trying to buy more than balance 
  amount -= amount / 100;
  amount = this.roundAmount(amount);
  
  // decrease purchase price by 1% less than asking price
  //price -= price / 100;
  amount *= price;
  
  var set = function(err, data) {
    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.errorMessage))
      err = data.errorMessage;
    if(err)
      return log.error('unable to buy', err);
  callback(null, data.return.order_id);
  }.bind(this);
  this.bitcoincoid.createOrders(
    this.pair + '',
    this.type,
    price,
    amount,
    set
  );
}

Trader.prototype.sell = function(amount, price, callback) {
  this.type = 'sell';
  
  // increase purchase price by 1% more than bidding price
  //price += price / 100;
  
  amount = this.roundAmount(amount);
  var set = function(err, data) {
    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.errorMessage))
      err = data.errorMessage;
    if(err)
      return log.error('unable to sell', err)
    callback(null, data.return.order_id);
  }.bind(this);
  this.bitcoincoid.createOrders(
    this.pair + '',
    this.type,
    price,
    amount,
    set
  );
}

Trader.prototype.checkOrder = function(order, callback) {
  var args = _.toArray(arguments);
  if (order == null) {
    return callback('no order_id', false);
  }
  var check = function(err, data) {
    if(err){
      return this.retry(this.checkOrder, arguments);
    }
    var status = data.return.order.status;
      if (status === 'filled') {
        return callback(err, true);
      } else if (status === 'open') {
        return callback(err, false);
      }
    callback(err, false);
    }.bind(this);

  this.bitcoincoid.getOrderDetails(this.pair, order, check);
}

Trader.prototype.getOrder = function(order, callback) {
  var args = _.toArray(arguments);
  if (order == null) {
    return callback('no order_id', false);
  }
  var get = function(data, err) {
    if(err)
      return callback(err);
  
    var price = 0;
    var amount = 0;
    var date = moment(0);

      if(!data.success)
        return callback(null, {price, amount, date});

    var result = data.return.order;
    var orderAmount = result.order+'_'+this.asset;
    price = result.Price;
    amount = result.orderAmount;

      if(result.status === 'open') {
        date = moment(result.submit_time);
      } else {
        date = moment(result.finish_time);
      }
    callback(err, {price, amount, date});
  }.bind(this);

   this.bitcoincoid.getOrderDetails(this.pair, order, get);
}

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(err, data) {

    if(err){
       return log.error('unable to cancel order: ',order, '(', err, '), retrying...');
       this.retry(this.cancelOrder, args);
    }
    callback();
  };
  this.bitcoincoid.cancelOrder(this.pair, order, this.type, cancel);
}

Trader.getCapabilities = function () {
  return {
    name: 'Bitcoin.co.id',
    slug: 'bitcoin-co-id',
    currencies: ['IDR', 'BTC'],
    assets: [
      'BTC', 'BCH', 'BTS', 'ETH', 'ETC', 'LTC', 'WAVES', 'XRP', 'XZR', 'BTC', 'DASH', 'DOGE', 'NXT', 'XLM', 'XEM'
    ],
    markets: [

      // IDR <-> XXXX

      { pair: ['IDR', 'BTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['IDR', 'BCH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['IDR', 'ETH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['IDR', 'ETC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['IDR', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['IDR', 'WAVES'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['IDR', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['IDR', 'XZR'], minimalOrder: { amount: 0.01, unit: 'asset' } },

      // BTC <-> XXXX

      { pair: ['BTC', 'BTS'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'DASH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'DOGE'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'NXT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'XLM'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'XEM'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' } }

    ],
    requires: ['key', 'secret'],
    tid: 'tid',
    providesHistory: true,
    providesFullHistory: false,
    tradable: true
  };
}

module.exports = Trader;
