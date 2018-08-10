# Gekko Broker

Order execution library for bitcoin and crypto exchanges. This library is Gekko's execution engine for all live orders (simulated orders do not through Gekko Broker, they go through the paper trader). This library is intended for developers of trading systems in need for advanced order types on multiple exchanges over a unified API.

## Introduction

This library makes it easy to do (advanced) orders all crypto exchanges where Gekko can live trade at. See the complete list [here](https://gekko.wizb.it/docs/introduction/supported_exchanges.html).

This library allows you to:

- Get basic market data
  - ticker (BBO)
  - ~orderbook~ (TODO)
  - historical trades
- Get portfolio data
- Do an (advanced) order:
  - Submit the order to the exchange
  - Receive events about the status of the order:
    - submitted
    - open (accepted)
    - partially filled
    - rejected
    - completed
  - Mutate the order
    - cancel
    - amend
      - move
      - move limit
- Tracks orders submitted through the library.

## Status

Early WIP. All communication is via the REST APIs of exchanges. Not all exchanges are supported, see which ones are in [this doc](../introduction/supported_exchanges.md).

## Order types

This library aims to offer advanced order types, even on exchanges that do not natively support them by tracking the market and supplementing native order support on specific exchanges.

Working:

- Base orders
  - [Sticky Order](./sticky_order.md)

TODO:

- Base orders:
  - Limit Order
  - Market Order
- Triggers:
  - Stop
  - If Touched (stop but opposite direction)

### Example

Set up a Gekko Broker instance:

    // from the gekko repo (make sure you have deps installed
    // inside the exchange folder).
    const Broker = require('../gekko/exchange/GekkoBroker');
    // or from NPM
    // const Broker = require('gekko-broker');

    const binance = new Broker({
      currency: 'USDT',
      asset: 'BTC',
      private: true,

      exchange: 'binance',
      key: 'x', // add your API key
      secret: 'y' // add your API secret
    });

Now we have an instance that can create a [sticky order](./sticky_order.md):

    const type = 'sticky';
    const side = 'buy';
    const amount = 1;

    const order = binance.createOrder(type, side, amount);

    order.on('statusChange', s => console.log(now(), 'new status', s));
    order.on('fill', s => console.log(now(), 'filled', s));
    order.on('error', s => console.log(now(), 'error!', e));
    order.on('completed', a => {
      console.log(new Date, 'completed!');
      order.createSummary((err, s) => {
        console.log(new Date, 'summary:');
        console.log(JSON.stringify(s, null, 2));
      });
    });

This one doesn't have an upper limit price for what it will buy at. It will stick it's bid offer at BBO until it's filled. If you have a limit in mind you can specify it when creating, do this instead:

    const order = binance.createOrder(type, side, amount, { limit: 100 });

It will never offer to buy for more than 100, even if the BBO is above 100 (the bid will end up deep in the book).

At any point in time you can change the limit (or the amount), for example:

    order.moveLimit(120);

Running the above example (without setting a limit and moving it) will yield:

    root@foxtail:~/gb/nusadua# node b
    2018-07-29 03:46:02 new status SUBMITTED
    2018-07-29 03:46:02 new status OPEN
    2018-07-29 03:46:04 filled 1
    2018-07-29 03:46:04 new status FILLED
    2018-07-29T03:46:04.127Z 'completed!'
    2018-07-29T03:46:04.358Z 'summary:'
    {
      "price": 0.0017479,
      "amount": 1,
      "date": "2018-07-29T03:46:02.576Z",
      "side": "buy",
      "orders": 1,
      "fees": {
        "BNB": 0.00075
      },
      "feePercent": 0.075
    }

NOTE: not all status changes are documented and more events are planned but not implemented.

### TODO

- finish all exchange integrations that gekko supports
- finish all order types and triggers (under todo)
- implement websocket support (per exchange)
- use native move API calls wherever possible (poloniex)
