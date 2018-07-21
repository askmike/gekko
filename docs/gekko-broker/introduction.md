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

Early WIP. All communication is via the REST APIs of exchanges. Not all exchanges are supported.

Currently fully supported exchanges:

- Binance
- GDAX
- Poloniex
- Coinfalcon
- Kraken

Currently exchanges with limited support:

- bittrex

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

### TODO

- finish all exchange integrations that gekko supports
- finish all order types and triggers (under todo)
- implement websocket support (per exchange)
- use native move API calls wherever possible (poloniex)
