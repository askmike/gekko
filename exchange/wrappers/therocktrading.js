const Therocktrading = require('therocktrading');
const _ = require('lodash');
const moment = require('moment');
const retry = require('../exchangeUtils').retry;
const marketData = require("./therocktrading-markets.json");

const QUERY_DELAY = 350;

const Trader = function(config) {
  this.post_only = true;
  this.use_sandbox = false;
  this.name = 'Therocktrading';
  this.scanback = true;
  this.scanbackTid = 0;
  this.since = null;
  this.asset = config.asset;
  this.currency = config.currency;

  this.api_url = 'https://api.therocktrading.com';
  this.api_sandbox_url = 'https://api-staging.therocktrading.com';

  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;

    this.pair = [config.asset, config.currency].join('').toUpperCase();
    this.post_only =
      typeof config.post_only !== 'undefined' ? config.post_only : true;
    
    if (config.sandbox) {
      this.use_sandbox = config.sandbox;
    }

  }

  this.therocktrading = new Therocktrading(this.key, this.secret, 'Gekko Broker v' + require('../package.json').version);
};

const recoverableErrors = [
  'SOCKETTIMEDOUT',
  'TIMEDOUT',
  'CONNRESET',
  'CONNREFUSED',
  'NOTFOUND',
  'Rate limit exceeded',
  'Response code 5',
  'Therocktrading is currently under maintenance.',
  'HTTP 408 Error',
  'HTTP 504 Error',
  'HTTP 503 Error',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'ENETUNREACH'
];

const includes = (str, list) => {
  if(!_.isString(str))
    return false;

  return _.some(list, item => str.includes(item));
}

Trader.prototype.processResponse = function(method, next) {
  return (error, body) => {
    if (body && body.code) {
      error = new Error(`Error ${body.code}: ${body.msg}`);
    }

    if(!error && body && !_.isEmpty(body.message)) {
      error = new Error(body.message);
    }

    /*if(
      response &&
      response.statusCode < 200 &&
      response.statusCode >= 300
    ) {
      error = new Error(`Response code ${response.statusCode}`);
    }*/

    if(error) {
      if(_.isString(error)) {
        error = new Error(error);
      }

      if(includes(error.message, recoverableErrors)) {
        error.notFatal = true;
      }

      return next(error);
    }

    return next(undefined, body);
  }
};

Trader.prototype.getTrades = function(since, callback, descending) {
  const handle = (err, data) => {
    if (err) return callback(err);
    var trades = [];
    if (_.isArray(data.trades)) {
      trades = _.map(data.trades, function(trade) {
        return {
          tid: trade.id,
          price: trade.price,
          amount: trade.amount,
          date: moment.utc(trade.date).format('X')
        };
      });
    }

    callback(null, descending ? trades : trades.reverse());
  };

  if (moment.isMoment(since)) since = since.format();
  //if (moment.isMoment(to)) to = to.format();

  var options = {
    order: "DESC" // which is default at therock
  }
  if (since)
  	options.after = since;
  const fetch = cb => this.therocktrading.trades(this.pair, options, this.processResponse('getTrades', cb));
  retry(null, fetch, handle);
};


Trader.prototype.getTicker = function(callback) {
  const result = (err, data) => {
    if (err) return callback(err);
    callback(undefined, { bid: data.bid, ask: data.ask });
  };

  const fetch = cb =>
    this.therocktrading.ticker(this.pair, this.processResponse('getTicker', cb));
  retry(null, fetch, result);
};

Trader.prototype.getFee = function(callback) {
  const fee = 0.2;
  // should check for discounts ?
  callback(undefined, fee);
};

Trader.prototype.getPortfolio = function(callback) {
  const result = (err, data) => {
    if (err) return callback(err);
    var portfolio = data.balances.map(function(balance) {
      return {
        name: balance.currency.toUpperCase(),
        amount: parseFloat(balance.trading_balance),
      };
    });
    callback(undefined, portfolio);
  };

  const fetch = cb => this.therocktrading.balances(this.processResponse('getPortfolio', cb));
  retry(undefined, fetch, result);
};


Trader.prototype.buy = function(amount, price, callback) {
  const handle = (err, result) => {
    if(err) {
      return callback(err);
    }
    callback(undefined, result.id);
  }
  const fetch = next => {
    this.therocktrading.buy(this.pair, amount.toString(), price.toString(), this.processResponse('order', next))
  };
  retry(null, fetch, handle);  
}

Trader.prototype.sell = function(amount, price, callback) {
  const handle = (err, result) => {
    if(err) {
      return callback(err);
    }
    callback(undefined, result.id);
  }
  const fetch = next => {
    this.therocktrading.sell(this.pair, amount.toString(), price.toString(), this.processResponse('order', next))
  };
  retry(null, fetch, handle);  
}


Trader.prototype.getOrder = function(order, callback) {
  const handle = (err, result) => {
    if(err)
      return callback(err);

    let price = 0;
    let amount = 0;
    let date = moment(0);

    if(result.amount === result.amount_unfilled) {
      return callback(null, {price, amount, date});
    }

    _.each(result.trades, trade => {
      date = moment(trade.date);
      price = ((price * amount) + (+trade.price * trade.amount)) / (+trade.amount + amount);
      amount += +trade.amount;
    });

    const fees = {};
    const feePercent = this.makerFee;

    const fee = price * amount * feePercent;
    fees[this.currency] = fee;

    callback(err, {price, amount, date, fees, feePercent});
  };

  const fetch = cb => this.therocktrading.order_status(this.pair, order, this.processResponse('order_status', cb));
  retry(null, fetch, handle);
};

Trader.prototype.checkOrder = function(order, callback) {
  const result = (err, data) => {
    if (err) return callback(err);

    var status = data.status;
    if (status == 'executed') {
      return callback(undefined, { executed: true, open: false, filledAmount: parseFloat(data.amount) });
    } else if (status === 'deleted') {
      return callback(undefined, { executed: false, open: false, filledAmount: parseFloat(data.amount - data.amount_unfilled) });
    } else if (status === 'active') {
      // should check if not expired (data.close_on)?
      return callback(undefined, { executed: false, open: true, filledAmount:  parseFloat(data.amount - data.amount_unfilled) });
    }

    callback(new Error('Unknown status ' + status));
  };

  const fetch = cb =>
    this.therocktrading.order_status(this.pair, order, this.processResponse('order_status', cb));
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
    this.therocktrading.cancel_order(this.pair, order, this.processResponse('cancel_order', cb));
  retry(null, fetch, result);
};

Trader.prototype.roundAmount = function(amount) {
  return _.floor(amount, 8);
}

Trader.prototype.roundPrice = function(price) {
  return +price;
}

Trader.getCapabilities = function() {
  return {
    name: 'Therocktrading',
    slug: 'therocktrading',
    currencies: marketData.currencies,
    assets: marketData.assets,
    markets: marketData.markets,
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    // following tid, define type to use on trade to batch trades
    tid: 'tid',
    tradable: true,
    gekkoBroker: 0.6
  };
};

module.exports = Trader;

