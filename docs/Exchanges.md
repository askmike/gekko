# Exchanges

*This is a technical document about the requirements per exchange as implemented for Gekko in the `exchange` folder. If you are interested in setting up Gekko for different exchanges check out [Configuring Gekko](https://github.com/askmike/gekko/blob/master/docs/Configuring_gekko.md).*

Gekko arranges all communication about when assets need to be bought or sold between the *trading method* and the *portfolio manager*. Exchanges are implemented by the portfolio manager, all differences between the different API's are abstracted away just below the portfolio manager. This document describes all requirements for adding a new exchange to Gekko. 

## Gekko's expectations

When you add a new exchange to Gekko you need to expose an object that has methods to query the exchange. This exchange file needs to reside in `gekko/exchanges` and the filename is the slug of the exchange name + `.js`. So for example the exchange for Mt. Gox is explained in `gekko/exchanges/mtgox.js`.

It is advised to use a npm module to query an exchange. This will seperate the abstract API calls from the Gekko specific stuff (In the case of Bitstamp there was no module yet, so I [created one](https://github.com/askmike/bitstamp)).

Besides this javascript file a new object needs to be added to `gekko/config.js` in the `config.traders` array. Here you can set the default currency and asset that will be available through the exchange. Keep enabled at false, this is up to the end user.

Finally Gekko needs to know how it can interact with the exchange, add an object to the `exchanges` array in `gekko/exchanges.js`. The parameters are described in that document.

## Portfolio manager's expectations

*If this documentation is not clear it please look at the 3 examples in `gekko/exchanges/`.*

The portfolio manager implements an exchange like so:

    var Exchange = require('./exchanges/' + [exchange slug]);
    this.exchange = new Exchange({key: '', secret: ''});

It will run the following methods on the exchange object:

### getTicker

    this.exchange.getTicker(callback)

The callback needs to have the parameters of `err` and `ticker`. Ticker needs to be an object with atleast the `bid` and `ask` property in float.

### getFee

    this.exchange.getFee(callback)

The callback needs to have the parameters of `err` and `fee`. Fee is a float that represents the amount the exchange takes out of the orders Gekko places. If an exchange has a fee of 0.2% this should be `0.0002`.

### getPortfolio

    this.exchange.getPortfolio(callback)

The callback needs to have the parameters of `err` and `portfolio`. Portfolio needs to be an array of all currencies and assets combined in the form of objects, an example object looks like `{name: 'BTC', amount: 1.42131}` (name needs to be an uppercase string, amount needs to be a float).

### buy

    this.exchange.buy(amount, price, callback);

### sell

    this.exchange.sell(amount, price, callback);

This should create a buy / sell order at the exchange for [amount] of [asset] at [price] per 1 asset. If you have set `infinityOrder` to `true` the amount will be 10000. If you have set `direct` to `true` the price will be `false`. The callback needs to have the parameters `err` and `order`. The order needs to be something that can be fed back to the exchange to see wether the order has been filled or not.

### checkOrder

    this.exchange.checkOrder(order, callback);

The order will be something that the manager previously received via the `sell` or `buy` methods. The callback should have the parameters `err` and `filled`. Filled is a boolean that is true when the order is already filled and false when it is not. Currently only partially filled orders should be treated as not filled.

### cancelOrder

    this.exchange.cancelOrder(order);

The order will be something that the manager previously received via the `sell` or `buy` methods.

## Trading method's expectations

The trading method analyzes exchange data to determine what to do. The trading method will also implement an exchange and run one method to fetch data:

### getTrades

    this.watcher.getTrades(since, callback, descending);

The since parameter is a [moment](http://momentjs.com/), this is a wrapper around a Date object. This moment represents the point in time from when the trading method needs trade data. The callback expects a `trades` object. Trades is an array of trade objects in chronological order (0 is older trade, 1 is newer trade). Each trade object needs to have the `date` property (unix timestamp in either string or int) and a `price` property (float) which represents the price in [currency] per 1 [asset]. `descending` is a boolean describing if the trades need to be returned in chronological descending order (newest first).
