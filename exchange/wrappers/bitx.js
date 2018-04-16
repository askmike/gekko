var BitX = require("bitx");
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

var Trader = function(config) {
    _.bindAll(this);
    if (_.isObject(config)) {
        this.key = config.key;
        this.secret = config.secret;
    }
    this.name = '[BitX]';
    this.currency = config.currency;
    this.asset = config.asset;
    this.pair = config.asset + config.currency;
    this.bitx = new BitX(this.key, this.secret, { pair: this.pair });
    this.trades = [];
    this.market = _.find(Trader.getCapabilities().markets, (market) => {
      return market.pair[0] === this.currency && market.pair[1] === this.asset
    });
}

Trader.prototype.retry = function(method, args) {
    var wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'Returned an error, retrying in', wait / 1000, '(s)..');
    var self = this;
    // make sure the callback (and any other fn)
    // is bound to Trader
    _.each(args, function(arg, i) {
        if (_.isFunction(arg))
            args[i] = _.bind(arg, self);
    });
    // run the failed method again with the same
    // arguments after wait
    setTimeout(
        function() {
            method.apply(self, args)
        },
        wait
    );
}

Trader.prototype.roundAmount = function(amount, digits) {
    var precision = 100000000;
    if (Number.isInteger(digits)) precision = Math.pow(10, digits);
    amount *= precision;
    amount = Math.floor(amount);
    amount /= precision;
    return amount;
};

//------- Gekko Functions ---------//
Trader.prototype.getTicker = function(callback) {
    var args = _.toArray(arguments);
    var process = function(err, data) {
        if (err) {
            log.error('ERROR: --> ', err);
            return this.retry(this.getTicker, args);
        }
        //log.debug('data: --> \n', data);
        var ticker = {
            ask: data.ask,
            bid: data.bid,
        };
        log.debug(this.name, ': getTicker --> ask:', data.ask, 'bid:', data.bid);
        callback(err, ticker);
    }.bind(this);
    //log.debug(this.name, ': getTicker ---');
    this.bitx.getTicker(process);
}

Trader.prototype.getFee = function(callback) {
    var args = _.toArray(arguments);
    // var process = function(err, data) {
    //     if (err) {
    //         log.error('error --> ', err);
    //         return this.retry(this.getFee, args);
    //     }
    //     //log.debug(this.name, ': getFee -->', data.taker_fee / 100);
    //     callback(false, data.taker_fee / 100);
    // }.bind(this);
    // //log.debug(this.name, ': getFee ---');
    // this.bitx.getFee(process);

    if (this.pair === 'ETHXBT')
        callback(null, 0.000025);
    else if (this.pair === 'XBTIDR')
        callback(null, 0.00002);
    else
        callback(null, 0.0001);
}

Trader.prototype.getPortfolio = function(callback) {
    var args = _.toArray(arguments);
    var process = function(err, data) {
        if (err) {
            log.error('error --> ', err);
            return this.retry(this.getPortfolio, args);
        }
        var assetAmount = currencyAmount = assetHold = currencyHold = 0;
        _.forEach(data.balance, function(t) {
            if (this.asset === t.asset) {
                assetAmount = t.balance;
                assetHold = t.reserved;
            } else if (this.currency === t.asset) {
                currencyAmount = t.balance;
                currencyHold = t.reserved;
            }
        }.bind(this))
        //log.debug('result --> ', assetAmount, assetHold, currencyAmount, currencyHold);
        //invert isNumber check... coz it's bugged??
        if (
            _.isNumber(assetAmount) || _.isNaN(assetAmount) ||
            _.isNumber(currencyAmount) || _.isNaN(currencyAmount)
        ) {
            return log.error('account balance error: Gekko is unable to trade with ', this.currency.toUpperCase(), ':', currencyAmount, ' or ', this.asset.toUpperCase(), ':', assetAmount);
        }
        var portfolio = [
            { name: this.asset.toUpperCase(), amount: assetAmount - assetHold },
            { name: this.currency.toUpperCase(), amount: currencyAmount - currencyHold }
        ];
        log.debug(this.name, ': getPortfolio --> ' + JSON.stringify(portfolio));
        callback(err, portfolio);
    }.bind(this);
    //log.debug(this.name, ': getPortfolio ---');
    this.bitx.getBalance(process);
}

Trader.prototype.buy = function(amount, price, callback) {
    var args = _.toArray(arguments);
    var process = function(err, data) {
        if (err) {
            if (_.contains(err.message, 'Insufficient balance')) {
                log.error('unable to buy: (', err.message, ')');
                return callback(err.message, null);
            } else {
                log.error('unable to buy', err.message);
                return this.retry(this.buy, args);
            }
        }
        log.debug('order id: --> ', data.order_id);
        callback(err, data.order_id);
    }.bind(this);
    log.debug(this.name, ': buy --- amount: ', amount, 'price: ', price);
    this.bitx.postBuyOrder(amount, price, process);
}

Trader.prototype.sell = function(amount, price, callback) {
    var args = _.toArray(arguments);
    var process = function(err, data) {
        if (err) {
            log.error('unable to sell', err.message);
            return this.retry(this.sell, args);
        }
        log.debug('order id: --> ', data.order_id);
        callback(err, data.order_id);
    }.bind(this);
    log.debug(this.name, ': sell --- amount: ', amount, 'price: ', price);
    this.bitx.postSellOrder(amount, price, process);
}

Trader.prototype.getLotSize = function(tradeType, amount, price, callback) {
    amount = this.roundAmount(amount, this.market.minimalOrder.precision);
    if (amount < this.market.minimalOrder.amount)
        return callback(null, { amount: 0, price: 0 });
    callback(null, { amount: amount, price: price });
}

Trader.prototype.getOrder = function(order, callback) {
    var args = _.toArray(arguments);
    if (order == null) {
        return callback('no order_id', false);
    }
    var process = function(err, data) {
        if (err) {
            log.error('error --> ', err);
            return this.retry(this.getOrder, args);
        }
        var price = 0;
        var amount = 0;
        var date = moment(0);
        price = parseFloat(data.limit_price);
        amount = parseFloat(data.base);
        if (data.state === 'PENDING') {
            date = moment(data.creation_timestamp);
        } else {
            date = moment(data.completed_timestamp);
        }
        log.debug('order --> price, amount, date --> ', price, amount, date);
        callback(err, { price, amount, date });
    }.bind(this);
    log.debug(this.name, ': getOrder --- order: ', order);
    this.bitx.getOrder(order, process);
}

Trader.prototype.checkOrder = function(order, callback) {
    var args = _.toArray(arguments);
    if (order == null) {
        return callback('no order_id', false);
    }
    var process = function(err, data) {
        if (err) {
            log.error('error --> ', err);
            return this.retry(this.checkOrder, args);
        }
        var stillThere = _.find(data.orders, function(o) {
            return o.order_id === order
        });
        log.debug(this.name, ': checkOrder ---alreadyFilled? --> ', !stillThere);
        callback(err, !stillThere);
    }.bind(this);
    //log.debug(this.name, ': checkOrder ---');
    this.bitx.getOrderList({ state: 'PENDING' }, process);
}

Trader.prototype.cancelOrder = function(order, callback) {
    var args = _.toArray(arguments);
    var process = function(err, data) {
        if (err) {
            if (_.contains(err.message, 'Invalid order_id')) {
                return log.error('unable to cancel order: ', order, '(', err.message, '), aborting...');
            }
            if (_.contains(err.message, 'Cannot stop unknown')) {
                log.error('unable to cancel order: ', order, '(', err.message, '), assuming success...');
                callback();
            } else {
                log.error('unable to cancel order: ', order, '(', err, '), retrying...');
                return this.retry(this.cancelOrder, args);
            }
        }
        log.debug('status--> ', data);
        callback();
    }.bind(this);
    log.debug(this.name, ': cancelOrder --- order: ', order);
    this.bitx.stopOrder(order, process);
}

Trader.prototype.getTrades = function(since, callback, descending) {
    var args = _.toArray(arguments);
    var process = function(err, result) {
        if (err) {
            log.error('error --> ', err);
            return this.retry(this.getTrades, args);
        }
        trades = _.map(result.trades, function(t) {
            return {
                price: t.price,
                date: Math.round(t.timestamp / 1000),
                amount: t.volume,
                tid: t.timestamp // we use this as tid
            };
        });
        // Decending by default
        if (!descending) {
            trades = trades.reverse()
        }
        callback(null, trades);
    }.bind(this);

    if(moment.isMoment(since)) since = since.valueOf();
    (_.isNumber(since) && since > 0) ? since : since = null;

    // log.debug(this.name, ': getTrades --- since: ', since);
    this.bitx.getTrades({ since: since, pair: this.pair }, process);
}

Trader.getCapabilities = function() {
    return {
        name: 'BitX',
        slug: 'bitx',
        currencies: ['MYR', 'KES', 'NGN', 'ZAR', 'XBT'],
        assets: ['ETH', 'XBT'],
        markets: [
            { pair: ['XBT', 'ETH'], minimalOrder: { amount: 0.01, precision: 2 } },
            { pair: ['MYR', 'XBT'], minimalOrder: { amount: 0.0005, precision: 6 } },
            { pair: ['KES', 'XBT'], minimalOrder: { amount: 0.0005, precision: 6 } },
            { pair: ['NGN', 'XBT'], minimalOrder: { amount: 0.0005, precision: 6 } },
            { pair: ['ZAR', 'XBT'], minimalOrder: { amount: 0.0005, precision: 6 } },
        ],
        requires: ['key', 'secret'],
        providesFullHistory: true,
        providesHistory: 'date',
        // maxHistoryFetch: 100,
        tid: 'tid',
        tradable: true,
        forceReorderDelay: true
    };
}

module.exports = Trader;
