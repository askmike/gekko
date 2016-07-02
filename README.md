# Gekko [![Build Status](https://travis-ci.org/askmike/gekko.png)](https://travis-ci.org/askmike/gekko)

![Gordon Gekko](http://mikevanrossum.nl/static/gekko.jpg)

*The most valuable commodity I know of is information.*

-Gordon Gekko

Gekko is a Bitcoin trading bot and backtesting platform that connects to popular Bitcoin exchanges. It is written in javascript and runs on [nodejs](http://nodejs.org).

*Use Gekko at your own risk.*

## Main features

* Automated trading (trade bot)
* Paper trading (for TA strategies)
* Backtester (for TA strategies)
* Tool for systematic trading
* Low level market library
 * Monitor the live market
 * Import historical market data
 * Broadcast market data over pubsub messaging systems

## TA strategies

Gekko comes with some [basic strategies](https://github.com/askmike/gekko/blob/stable/docs/Trading_methods.md) (which implement a single indicator). But with some basic javascript you can [create your own strategies](https://github.com/askmike/gekko/blob/stable/docs/internals/trading_methods.md). You can use over 130 indicators to create your perfect prediction model. *Why don't you combine Bollinger Bands, CCI and MACD with a STOCHRSI indicator?*

## Automated Trading platform

Gekko can watch the realtime markets, you can [apply automated trading methods](https://github.com/askmike/gekko/blob/stable/docs/internals/trading_methods.md) to do live or simulated trading ([automated trading](https://github.com/askmike/gekko/blob/stable/docs/Plugins.md#trader) or [paper trading](https://github.com/askmike/gekko/blob/stable/docs/Plugins.md#profit-simulator-paper-trader)). Gekko stores all market data it sees, this makes it possible to simulate trading strategies against historical data to see whether they would have been profitable ([backtesting](https://github.com/askmike/gekko/blob/stable/docs/Backtesting.md)).

Gekko is not built for HFT or anything related to being the fastest (like arbitrage). The trading methods Gekko can do are based on TA indicators used by human day traders. This means that Gekko does not look at data below the one minute timescale and will not trade more than a couple of times per week (depending on configuration).

**So Gekko is not:**

- A trading platform for human day traders with a GUI and charts.
- A High frequency trading bot designed to operate on < minute resolution.
- A fully automated trading bot that you turn on and will generate profit without you having to do anything.
- An exchange.
- An arbitrage bot.

## Supported exchanges

| Exchange        | Monitoring | [Trading](https://github.com/askmike/gekko/blob/stable/docs/Plugins.md#trader) | [Importing](https://github.com/askmike/gekko/blob/stable/docs/Importing.md) | Notes |
| --------------- |:----------:|:-------:|:---------:|-------|
| [Poloniex](https://poloniex.com/)      | ✓ | ✓ | ✓ | |
| [BTCC](https://btcc.com/)      | ✓ | ✓ | ✓ | is BTCChina |
| [Bitstamp](https://bitstamp.com/)      | ✓ | ✓ | ✗ | |
| [Kraken](https://kraken.com/)      | ✓ | ✓ | ✗ | |
| [Bitfinex](https://bitfinex.com/)      | ✓ | ✓ | ✗ | |
| [BTC-e](https://btc-e.com/)      | ✓ | ✓ | ✗ | |
| [Cex.io](https://bitstamp.com/)      | ✓ | ✗ | ✗ | |
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

Windows user? Here is a [step-by-step guide](https://github.com/askmike/gekko/blob/stable/docs/installing_gekko_on_windows.md) on how to get Gekko running on Windows.

Gekko runs on [nodejs](http://nodejs.org/), once you have that installed you can either download all files in [a zip](https://github.com/askmike/gekko/archive/stable.zip) or clone the repository via git:

    git clone git://github.com/askmike/gekko.git
    cd gekko

You need to download Gekko's dependencies, which can easily be done with [npm](http://npmjs.org) (this came with your nodejs installation):

    npm install

Docker user? Installing and running gekko is simple on Docker with the following command:

    docker run -d -v /path/to/your/config.js:/usr/src/gekko/config.js --name gekko barnumd/gekko` 

To see process logs: `docker logs --follow gekko`. More info can be found [here](https://hub.docker.com/r/barnumd/gekko/).

## Configuring Gekko

> Configuring Gekko consists of two parts: 
> 
> - Watching a realtime market
> - Enabling plugins

Read the [configuring Gekko documentation](https://github.com/askmike/gekko/tree/stable/docs/Configuring_gekko.md) for a detailed explanation. Don't forget to rename a copy of `sample-config.js` to `config.js`.

## Running Gekko

    node gekko

For backtesting, please see the [backtesting documentation](https://github.com/askmike/gekko/blob/stable/docs/Backtesting.md).

You can also run Gekko silently or use more complex features, for examples check out the [advanced features](https://github.com/askmike/gekko/tree/stable/docs/Advanced_features.md).

## Updating Gekko

If you installed Gekko via git you can easily fetch the latest updates by running:

    git pull && npm install

## How does Gekko work?

![Gekko architecture](https://wizb.it/gekko/static/architecture.jpg)

- Read about [Gekko's overall architecture](https://github.com/askmike/gekko/tree/stable/docs/internals/architecture.md).
- Read on how to add [a new exchange to Gekko](https://github.com/askmike/gekko/tree/stable/docs/internals/exchanges.md).
- Read on how to [create your own plugin](https://github.com/askmike/gekko/tree/stable/docs/internals/plugins.md).
- Implement [your own trading method](https://github.com/askmike/gekko/blob/stable/docs/internals/trading_methods.md) and share it back.

## TODO

* Stabilize importing API.
* More tests
* Better documentation for TA-lib indicators.
* More indicators (maybe use [this native js lib](https://github.com/anandanand84/technicalindicators)?)
* Webbased interface ([first step](https://github.com/askmike/gekko/issues/338#issuecomment-228368499))?

*Better exchange support:*

- add GDAX exchange (supports [importing](https://docs.gdax.com/#get-historic-rates))
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
