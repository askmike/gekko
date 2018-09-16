const moment = require('moment');
const _ = require('lodash');
const marketData = require('./coinfalcon-markets.json');

const CoinFalcon = require('coinfalcon');

var Trader = function(config) {
  _.bindAll(this, [
    'roundAmount',
    'roundPrice'
  ]);

  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase();
    this.asset = config.asset.toUpperCase();
  }

  this.pair = this.asset + '-' + this.currency;
  this.name = 'coinfalcon';

  this.market = _.find(Trader.getCapabilities().markets, (market) => {
    return market.pair[0] === this.currency && market.pair[1] === this.asset
  });

  this.coinfalcon = new CoinFalcon.Client(this.key, this.secret);

  this.interval = 1500;
};

const includes = (str, list) => {
  if(!_.isString(str))
    return false;

  return _.some(list, item => str.includes(item));
}

const recoverableErrors = [
  'SOCKETTIMEDOUT',
  'TIMEDOUT',
  'CONNRESET',
  'ECONNRESET',
  'CONNREFUSED',
  'NOTFOUND',
  '429',
  '522',
  '429',
  '504',
  '503',
  '500',
  '502',
  '408',
  // "The timestamp 1527996378 is invalid, current timestamp is 1527996441."
  'is invalid, current timestamp is',
  'EHOSTUNREACH',
  // https://github.com/askmike/gekko/issues/2407
  'We are fixing a few issues, be back shortly.',
  'Client network socket disconnected before secure TLS connection was established',
  'socket hang up',
  // getaddrinfo EAI_AGAIN coinfalcon.com coinfalcon.com:443
  'EAI_AGAIN'
];

Trader.prototype.processResponse = function(method, args, next) {
  const catcher = err => {
    if(!err || !err.message)
      err = new Error(err || 'Empty error');

    if(includes(err.message, recoverableErrors))
      return this.retry(method, args);

    console.log(new Date, '[cf] big error!', err.message);

    return next(err);
  }

  return {
    failure: catcher,
    success: data => {
      if(!data)
        return catcher();

      if(data.error)
        return catcher(data.error);

      if(includes(data, ['Please complete the security check to proceed.']))
        return next(new Error(
          'Your IP has been flagged by CloudFlare. ' +
          'As such Gekko Broker cannot access Coinfalcon.'
        ));

      next(undefined, data);
    }
  }
}

Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(1, 'seconds');

  // run the failed method again with the same arguments after wait
  setTimeout(() => {
    method.apply(this, args);
  }, wait);
};

Trader.prototype.getTicker = function(callback) {
  const handle = this.processResponse(this.getTicker, [callback], (err, res) => {
    if(err)
      return callback(err);

    callback(null, {bid: +res.data.bids[0].price, ask: +res.data.asks[0].price})
  });

  var url = "markets/" + this.pair + "/orders?level=1"

  this.coinfalcon.get(url).then(handle.success).catch(handle.failure);
};

Trader.prototype.getFee = function(callback) {
  var fees = 0; // 0% for making!
  callback(false, fees / 100);
};

Trader.prototype.getPortfolio = function(callback) {
  const handle = this.processResponse(this.getPortfolio, [callback], (err, res) => {
    if(err)
      return callback(err);

    var portfolio = res.data.map(account => ({
      name: account.currency_code.toUpperCase(),
      amount: parseFloat(account.available_balance)
    }));

    callback(null, portfolio);
  });

  this.coinfalcon.get('user/accounts').then(handle.success).catch(handle.failure);
};

Trader.prototype.addOrder = function(type, amount, price, callback) {
  const args = _.toArray(arguments);

  const handle = this.processResponse(this.addOrder, args, (err, res) => {
    if(err)
      return callback(err);

    callback(false, res.data.id);
  });

  const payload = {
    order_type: type,
    operation_type: 'limit_order',
    market: this.pair,
    size: amount + '',
    price: price + ''
  }

  this.coinfalcon.post('user/orders', payload).then(handle.success).catch(handle.failure);
};

['buy', 'sell'].map(function(type) {
  Trader.prototype[type] = function(amount, price, callback) {
    this.addOrder(type, amount, price, callback);
  };
});

const round = function(number, precision) {
  var factor = Math.pow(10, precision);
  var tempNumber = number * factor;
  var roundedTempNumber = Math.round(tempNumber);
  return roundedTempNumber / factor;
};

// ticksize 0.01 will yield: 2
Trader.prototype.getPrecision = function(tickSize) {
  if (!isFinite(tickSize)) {
    return 0;
  }
  var e = 1;
  var p = 0;
  while (Math.round(tickSize * e) / e !== tickSize) {
    e *= 10; p++;
  }
  return p;
};

Trader.prototype.roundAmount = function(amount) {
  return round(amount, this.getPrecision(this.market.minimalOrder.amount));
}

Trader.prototype.roundPrice = function(price) {
  return round(price, this.getPrecision(this.market.minimalOrder.price));
}

Trader.prototype.outbidPrice = function(price, isUp) {
  let newPrice;

  if(isUp) {
    newPrice = price + this.market.minimalOrder.price;
  } else {
    newPrice = price - this.market.minimalOrder.price;
  }

  return this.roundPrice(newPrice);
}

Trader.prototype.getOrder = function(order, callback) {
  const args = _.toArray(arguments);
  const handle = this.processResponse(this.getOrder, args, (err, res) => {
    if(err)
      return callback(err);

    const price = parseFloat(res.data.price);
    const amount = parseFloat(res.data.size_filled);
    const date = moment(res.data.created_at);
    const fees = {};
    const feePercent = 0;
    callback(false, { price, amount, date, fees, feePercent });
  });

  this.coinfalcon.get('user/orders/' + order).then(handle.success).catch(handle.failure);
};

Trader.prototype.checkOrder = function(order, callback) {
  const args = _.toArray(arguments);

  const handle = this.processResponse(this.checkOrder, args, (err, res) => {
    if(err)
      return callback(err);

    // https://docs.coinfalcon.com/#list-orders
    const status = res.data.status;

    if(status === 'canceled') {
      return callback(undefined, { executed: false, open: false });
    } if(status === 'fulfilled') {
      return callback(undefined, { executed: true, open: false });
    } if(
      status === 'pending' ||
      status === 'partially_filled' ||
      status === 'open'
    ) {
      return callback(undefined, { executed: false, open: true, filledAmount: +res.data.size_filled });
    }

    console.error(res.data);
    callback(new Error('Unknown status ' + status));
  });

  this.coinfalcon.get('user/orders/' + order).then(handle.success).catch(handle.failure);
};

Trader.prototype.cancelOrder = function(order, callback) {
  const args = _.toArray(arguments);

  const handle = this.processResponse(this.cancelOrder, args, (err, res) => {

    if(err) {
      if(err.message.includes('has wrong status.')) {

        // see https://github.com/askmike/gekko/issues/2440
        console.log('CANCELFIX', order, 'order has wrong status...');
        return setTimeout(() => {
          this.checkOrder(order, (err, res) => {
            console.log('CANCELFIX', order, 'checked it:', res);

            if(err) {
              return callback(err);
            }

            if(!res.open) {
              return callback(undefined, true);
            }

            return setTimeout(
              () => this.cancelOrder(order, callback),
              this.interval
            );
          });
        }, this.interval);
      }
      return callback(err);
    }

    callback(undefined, false, {
      filled: res.data.size_filled
    });
  });

  this.coinfalcon.delete('user/orders/' + order).then(handle.success).catch(handle.failure);
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);

  var success = function(res) {
    var parsedTrades = [];
    _.each(
      res.data,
      function(trade) {
        parsedTrades.push({
          tid: trade.id,
          date: moment(trade.created_at).unix(),
          price: parseFloat(trade.price),
          amount: parseFloat(trade.size),
        });
      },
      this
    );

    if (descending) {
      callback(null, parsedTrades);
    } else {
      callback(null, parsedTrades.reverse());
    }
  }.bind(this);

  var failure = function (err) {
    err = new Error(err);
    return this.retry(this.getTrades, args, err);
  }.bind(this);

  var url = "markets/" + this.pair + "/trades"

  if (since) {
    url += '?since_time=' + (_.isString(since) ? since : since.format());
  }

  this.coinfalcon.get(url).then(success).catch(failure);
};

Trader.getCapabilities = function () {
  return {
    name: 'CoinFalcon',
    slug: 'coinfalcon',
    assets: marketData.assets,
    currencies: marketData.currencies,
    markets: marketData.markets,
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
    forceReorderDelay: false,
    gekkoBroker: 0.6
  };
}

module.exports = Trader;
