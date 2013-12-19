var cexio = require('cexio'),
   moment = require('moment'),
     nedb = require('nedb'),
    async = require('async'),
       db = new nedb({filename: 'cexio.db', autoload: true}),
        _ = require('lodash'),
     util = require('../util'),
      log = require('../log');

var Trader = function(config) {
  this.user = config.username;
  this.key = config.key;
  this.secret = config.secret;
  this.pair = 'ghs_' + config.currency.toLowerCase();
  this.name = 'cex.io';
  this.next_tid = 0;

  _.bindAll(this);

  this.cexio = new cexio(this.pair, this.user,
                        this.key, this.secret);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var self = this;
  var last_tid = next_tid = 0;

  if(since && !_.isNumber(since))
    since = util.toMicro(since);

  var args = _.toArray(arguments);

  // FIXME:  fetching and updating our db shall be done in an seperate
  // thread (timeout-callback) rather than here.  This method shall
  // only fetch and return from local db.

  async.waterfall([
    function(callback) {
      db.find({}, function(err, docs) {
        if(!docs || docs.length === 0)
          tid = 263000;
        else
          tid = 1 + _.max(docs, 'tid').tid;

        //log.info(self.name, 'Updating cex.io historical data store');
        log.debug(self.name, 'fetching from tid ' + tid);

        self.cexio.trades({since: tid},
          function(err, trades) {
            if(err || !trades || trades.length === 0)
              return self.retry(self.getTrades, args);
            else if('error' in trades)
              throw 'Error from cexio: ' + trades.error
            else {
              trades = trades.reverse();
              _.forEach(trades, function(trade) {
                // convert to int
                trade.amount = Number(trade.amount);
                trade.price = Number(trade.price);
                trade.tid = Number(trade.tid);
                trade.date = Number(trade.date);
                db.insert(trade);
              });
            }
            callback();
        });
      });
    },
    function(callback) {
      if(!since) {
        since = new Date().getTime() * 1000;
        since -= (10 * 1000 * 1000);
      }
      since = Math.floor(since / 1000 / 1000);
      log.debug('fetching since ' + since);

      db.find({'date': {$gte: since}}, function(err, docs) {
        docs = _.sortBy(docs, 'tid');
        // log.debug(self.name, docs);
        if(!docs || docs.length === 0)
          return self.retry(self.getTrades, args);
        callback(null, docs);
      });
    }
  ], function(err, result) {
    if(err) return log.error(self.name, 'error: ' + err);
    callback(result);
  });
}

Trader.prototype.buy = function(amount, price, callback) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  amount *= 100000000;
  amount = Math.floor(amount);
  amount /= 100000000;

  // test placing orders which will not be filled
  //price /=10; price = price.toFixed(8);

  log.debug('BUY', amount, 'GHS @', price, 'BTC');

  var set = function(err, data) {
    if(err)
      return log.error('unable to buy:', err);
    if(data.error)
      return log.error('unable to buy:', data.error);

    log.debug('BUY order placed.  Order ID', data.id);
    callback(data.id);
  };

  this.cexio.place_order('buy', amount, price, _.bind(set, this));
}

Trader.prototype.sell = function(amount, price, callback) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  amount *= 100000000;
  amount = Math.ceil(amount);
  amount /= 100000000;

  // test placing orders which will not be filled
  //price *= 10; price = price.toFixed(8);

  log.debug('SELL', amount, 'GHS @', price, 'BTC');

  var set = function(err, data) {
    if(err)
      return log.error('unable to sell:', err);
    if(data.error)
      return log.error('unable to sell:', data.error);

    log.debug('SELL order placed.  Order ID', data.id);
    callback(data.id);
  };

  this.cexio.place_order('sell', amount, price, _.bind(set, this));
}

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
  var calculate = function(err, data) {
    if(err)
      return this.retry(this.cexio.getInfo, calculate);

    currency = parseFloat(data.BTC.available)
    if(parseFloat(data.BTC.orders)){
      currency -= parseFloat(data.BTC.orders)
    }
    assets = parseFloat(data.GHS.available);
    if( parseFloat(data.GHS.orders)){
	  assets -= parseFloat(data.GHS.orders);
    }
	
    var portfolio = [];
    portfolio.push({name: 'BTC', amount: currency});
    portfolio.push({name: 'GHS', amount: assets});
    callback(err, portfolio);
  }
  this.cexio.balance(_.bind(calculate, this));
}

Trader.prototype.getTicker = function(callback) {
  var set = function(err, data) {
    var ticker = {
      ask: data.ask,
      bid: data.bid
    };
    callback(err, ticker);
  }
  this.cexio.ticker(_.bind(set, this));
}

Trader.prototype.getFee = function(callback) {
  // cexio does currently don't take a fee on trades
  callback(false, 0.0);
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {

    if(err)
      callback(false, true);
    if(result.error)
      callback(false, true);

    var exists = false;
    _.forEach(result, function(entry) {
      if(entry.id === order) {
        exists = true; return;
      }
    });
    callback(err, !exists);
  };

  this.cexio.open_orders(_.bind(check, this));
}

Trader.prototype.cancelOrder = function(order) {
  var check= function(err, result) {
    if(err)
      log.error('cancel order failed:', err);
    if(result.error)
      log.error('cancel order failed:', result.error);
  }
  this.cexio.cancel_order(order, check);
}

module.exports = Trader;
