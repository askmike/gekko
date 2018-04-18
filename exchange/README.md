# Gekko Broker

Order execution library for bitcoin and crypto exchanges. This library is Gekko's execution engine for all live orders (simulated orders go through the paper trader, which is a separate module). This library is intended for developers of trading systems in need for advanced order types on multiple exchanges over a unified API.

## Introduction

This library makes it easy to do (advanced) orders all crypto exchanges where Gekko can live trade at. See the complete list here: https://gekko.wizb.it/docs/introduction/supported_exchanges.html

This library allows you to:

- Get basic market data
  - ticker (BBO)
  - orderbook (TODO)
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

Early WIP. All communication is via the REST APIs of exhanges. Not all exchanges are supported.

## Order types

This library aims to offer advanced order types, even on exchanges that do not natively support them by tracking the market and supplimenting native order support on specific exchanges.

WIP:

- Base orders
  - Limit Order
  - Sticky Order

TODO:

- Base orders:
  - Market Order
- Triggers:
  - Stop
  - If Touched (stop but opposite direction)
  - Time

### Sticky Order

An advanced order that stays at the top of the book (until the optional limit). The order will automatically stick to the best BBO until the complete amount has been filled.

## Example usage

    const Broker = require('gekko-broker');

    const gdax = new Broker({
      currency: 'EUR',
      asset: 'BTC',

      exchange: 'gdax',

      // Enables access to private endpoints.
      // Needed to create orders and fetch portfolio
      private: true,

      key: 'x',
      secret: 'y',
      passphrase: 'z'
    });

    gdax.portfolio.setBalances(console.log);

    const type = 'sticky';
    const amount = 0.002;
    const side = 'buy';
    const limit = 6555;

    const order = gdax.createOrder(type, side, amount, { limit });
    order.on('statusChange', status => console.log(status));
    order.on('filled', result => console.log(result));
    order.on('completed', result => console.log(result));

### TODO

- finish all exchange integrations that gekko supports
- finsih all order types and triggers (under todo)
- implement websocket support (per exchange)
- 
