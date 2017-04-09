# Gekko [![npm](https://img.shields.io/npm/dm/gekko.svg)]() [![Build Status](https://travis-ci.org/askmike/gekko.png)](https://travis-ci.org/askmike/gekko) [![Build status](https://ci.appveyor.com/api/projects/status/github/askmike/gekko?branch=stable&svg=true)](https://ci.appveyor.com/project/askmike/gekko)

![Gordon Gekko](http://mikevanrossum.nl/static/gekko.jpg)

*The most valuable commodity I know of is information.*

-Gordon Gekko

Gekko is a Bitcoin TA trading and backtesting platform that connects to popular Bitcoin exchanges. It is written in javascript and runs on [nodejs](http://nodejs.org).

*Use Gekko at your own risk.*

## Main features

* Automated trading (trade bot)
* Paper trading (for TA strategies)
* [Backtester](https://github.com/askmike/gekko/blob/stable/docs/features/backtesting.md) (for TA strategies)
* Tool for systematic trading
* Low level market library
 * Monitor the live market
 * Import historical market data
 * Broadcast market data over pubsub messaging systems
* Web interface as well as a commandline interface

![screenshot of gekko ui](https://cloud.githubusercontent.com/assets/969743/23837675/a95da120-0783-11e7-9cab-6a209d4c928e.png)

## TA strategies

Gekko comes with some [basic strategies](https://github.com/askmike/gekko/blob/stable/docs/strategies/strategies.md) (which implement a single indicator). But with some basic javascript you can [create your own strategies](https://github.com/askmike/gekko/blob/stable/docs/strategies/creating_a_strategy.md). You can use over 130 indicators to create your perfect prediction model ([full list](https://github.com/askmike/gekko/blob/stable/docs/strategies/talib_indicators.md) of supported indicators). *Why don't you combine Bollinger Bands, CCI and MACD with a STOCHRSI indicator?*

## Automated Trading platform

Gekko can watch the realtime markets, you can TA strategies to do live or simulated trading. Gekko stores all market data it sees, this makes it possible to simulate trading strategies against historical data to see whether they would have been profitable (backtesting).

Gekko is not built for HFT or anything related to being the fastest (like arbitrage). The trading methods Gekko can do are based on TA indicators used by human day traders. This means that Gekko does not look at data below the one minute timescale and will not trade more than a couple of times per week (depending on configuration).

## So Gekko is not

- A trading platform for human day traders (although it can be used to support human traders)
- A High frequency trading bot designed to operate on < minute resolution
- A fully automated trading bot that you turn on and will generate profit without you having to do anything
- An exchange
- An arbitrage bot

## Supported exchanges

| Exchange        | Monitoring | Live Trading | Importing | Notes |
| --------------- |:----------:|:-------:|:---------:|-------|
| [Poloniex](https://poloniex.com/)      | ✓ | ✓ | ✓ | |
| [GDAX](https://gdax.com/)      | ✓ | ✓ | ✓ | |
| [BTCC](https://btcc.com/)      | ✓ | ✓ | ✓ | (=BTCChina) |
| [Bitstamp](https://bitstamp.com/)      | ✓ | ✓ | ✗ | |
| [Kraken](https://kraken.com/)      | ✓ | ✓ | ✗ | |
| [Bitfinex](https://bitfinex.com/)      | ✓ | ✓ | ✗ | |
| [BTC-e](https://btc-e.com/)      | ✓ | ✓ | ✗ | |
| [Okcoin.cn](https://www.okcoin.cn/)      | ✓ | ✓ | ✗ | (China, see [#352](https://github.com/askmike/gekko/pull/352)) |
| [Cex.io](https://cex.io/)      | ✓ | ✓ | ✗ | |
| [BTC Markets](https://btcmarkets.net)      | ✓ | ✓ | ✗ | |
| [bitX](https://www.bitx.co/)      | ✓ | ✗ | ✗ | |
| [lakeBTC](https://lakebtc.com/)      | ✓ | ✗ | ✗ | |
| [meXBT](https://mexbt.com/)      | ✓ | ✗ | ✗ | see [here](https://github.com/askmike/gekko/issues/288#issuecomment-223810974). |
| [zaif](https://zaif.jp/trade_btc_jpy)      | ✓ | ✗ | ✗ | |
| [lakeBTC](https://lakebtc.com/)      | ✓ | ✗ | ✗ | |
| [bx.in.th](https://bx.in.th/)      | ✓ | ✗ | ✗ | |

Monitoring means that Gekko is able to watch the realtime market and thus also:

- Run trading strategies against the data (in semi-realtime)
- Simulate trading profits (paper trader)
- Store all data (to backtest in the future)

## Installing Gekko

See the doc [installing gekko](https://github.com/askmike/gekko/blob/stable/docs/installing_gekko.md).

## Running Gekko

    node gekko --ui

## How does Gekko work?

![Gekko architecture](https://wizb.it/gekko/static/architecture.jpg)

- Read about [Gekko's overall architecture](https://github.com/askmike/gekko/tree/stable/docs/internals/architecture.md).
- Read on how to add [a new exchange to Gekko](https://github.com/askmike/gekko/tree/stable/docs/internals/exchanges.md).
- Read on how to [create your own plugin](https://github.com/askmike/gekko/tree/stable/docs/internals/plugins.md).
- Implement [your own trading strategy](https://github.com/askmike/gekko/blob/stable/docs/internals/create_a_strategy.md) and share it back.

## TODO

* Stabilize importing API.
* More tests
* Better documentation for TA-lib indicators.
* More indicators (maybe use [this native js lib](https://github.com/anandanand84/technicalindicators)?)

*Better exchange support:*

- support importing at bitfinex ([here](http://docs.bitfinex.com/#trades)).
- add okcoin China
- add okcoin
- add bitmex
- fix cryptsy integration..

## Credits

* The title is inspired by [Bateman](https://github.com/fearofcode/bateman).
* This project is inspired by the [GoxTradingBot](https://github.com/virtimus/GoxTradingBot/) Chrome plugin (which in turn is inspired by [Goomboo's journal](https://bitcointalk.org/index.php?topic=60501.0)).

## Final

If Gekko helped you in any way, you can always leave me a tip at (BTC) 13r1jyivitShUiv9FJvjLH7Nh1ZZptumwW

## License

The MIT License (MIT)

Copyright (c) 2014 Mike van Rossum <mike@mvr.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
