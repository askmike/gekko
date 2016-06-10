# Gekko [![Build Status](https://travis-ci.org/askmike/gekko.png)](https://travis-ci.org/askmike/gekko)

![Gordon Gekko](http://mikevanrossum.nl/static/gekko.jpg)

*The most valuable commodity I know of is information.*

-Gordon Gekko

Gekko is a Bitcoin trading bot and backtesting platform that connects to popular Bitcoin exchanges. It is written in javascript and runs on [nodejs](http://nodejs.org).

*Use Gekko at you own risk.*

## Main features

* Automated trading (trade bot)
* Paper trading (for TA strategies)
* Backtester (for TA strategies)
* Tool for systematic trading
* Low level market library

## Automated Trading platform

Gekko can watch the realtime markets. You can apply automated trading methods to realtime data coming in to do live or simulated trading (automated trading or paper trading). Gekko also stores the market data it sees so you can run the trading methods with simulate trades on a set of historical data to see whether they would have been profitable during that time (backtesting).

Gekko, as well as the current bitcoin exchanges, are not built for HFT or anything related to being the fastest. The trading methods Gekko can do are based on indicators used by human day traders. The result is that Gekko does not look at data below the one minute timescale and (depending on configuration) and will normally not trade more than a couple of times per week (also depending on configuration).

**So Gekko is not:**

- A trading platform for human day traders with a GUI and charts.
- A High frequency trading bot designed to operate on < minute resolution.
- A fully automated trading bot that you turn on and will generate profit without you having to do anything.
- An exchange.

**Automated trading**

Gekko comes with a couple of trading methods that implement a single indicator (DEMA, MACD, RSI and PPO). The parameters of these indicators are all configurable and changing them changes the outcome drastically. Additionally Gekko also provides an easy way to write your own trading methods in javascript. Read more about that in the [documentation](https://github.com/askmike/gekko/blob/stable/docs/internals/trading_methods.md).

## Market interface

Gekko also has a plugin system that can do certain things whenever something happens or let Gekko communicate through more platforms. Gekko currently knows these plugins:

- Campfire: Enables Gekko to talk on [Campfire](https://campfirenow.com/) and report latest market data and advice.
- IRC bot: Enables Gekko to talk on IRC and report latest market data and advice.
- Mailer: Automatically sends email when your trading method has new advice.
- Profit Simulator (paper trader): Hold a fake portfolio and simulate trades based on advice.
- Redis Beacon: Broadcast events propagating through Gekko on [Redis pub/sub](http://redis.io/topics/pubsub).

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
> - Automate trading advice
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

* Backtester
* More exchanges
* More indicators (TA-lib, etc.)
* Webbased interface

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
