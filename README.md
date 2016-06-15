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

## Automated Trading platform

Gekko can watch the realtime markets, you can [apply automated trading methods](https://github.com/askmike/gekko/blob/stable/docs/internals/trading_methods.md) to do live or simulated trading ([automated trading](https://github.com/askmike/gekko/blob/stable/docs/Plugins.md#trader) or [paper trading](https://github.com/askmike/gekko/blob/stable/docs/Plugins.md#profit-simulator-paper-trader)). Gekko also stores all market data it sees, this makes it possible to simulate trading strategies against historical data to see whether they would have been profitable ([backtesting](https://github.com/askmike/gekko/blob/stable/docs/Backtesting.md)).

Gekko is not built for HFT or anything related to being the fastest (like arbitrage). The trading methods Gekko can do are based on TA indicators used by human day traders. The result is that Gekko does not look at data below the one minute timescale and (depending on configuration) and will normally not trade more than a couple of times per week (also depending on configuration).

**So Gekko is not:**

- A trading platform for human day traders with a GUI and charts.
- A High frequency trading bot designed to operate on < minute resolution.
- A fully automated trading bot that you turn on and will generate profit without you having to do anything.
- An exchange.
- An arbitrage bot.

## Market interface

Gekko has a plugin system that can do certain things whenever something happens or let Gekko communicate through external platforms. Check [all currently existing plugins](https://github.com/askmike/gekko/blob/stable/docs/Plugins.md) or [add your own](https://github.com/askmike/gekko/blob/stable/docs/internal/plugins.md).

## Supported exchanges

Gekko supports multiple cryptocurreny exchanges, see [here](https://github.com/askmike/gekko/blob/stable/docs/supported_exchanges.md).

## Installing Gekko

Windows user? Here is a [step-by-step guide](https://github.com/askmike/gekko/blob/stable/docs/installing_gekko_on_windows.md) on how to get Gekko running on Windows.

Gekko runs on [nodejs](http://nodejs.org/), once you have that installed you can either download all files in [a zip](https://github.com/askmike/gekko/archive/stable.zip) or clone the repository via git:

    git clone git://github.com/askmike/gekko.git
    cd gekko

You need to download Gekko's dependencies, which can easily be done with [npm](http://npmjs.org) (this came with your nodejs installation):

    npm install

## Configuring Gekko

> Configuring Gekko consists of three parts: 
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

    git pull && npm update

## How does Gekko work?

![Gekko 0.1.0 architecture](http://data.wizb.it/misc/gekko-0.1.0-architecture.jpg)

If you want to contribute or are interested in how Gekko works:

- Read about [Gekko's overall architecture](https://github.com/askmike/gekko/tree/stable/docs/internals/architecture.md).
- Read on how to add [a new exchange to Gekko](https://github.com/askmike/gekko/tree/stable/docs/internals/exchanges.md).
- Read on how to [create your own plugin](https://github.com/askmike/gekko/tree/stable/docs/internals/plugins.md).
- Implement [your own trading method](https://github.com/askmike/gekko/blob/stable/docs/internals/trading_methods.md) and share it back.

## TODO

* More tests
* More exchanges
* More indicators
* Webbased interface (?)

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
