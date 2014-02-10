# Important note

You are looking at the brand new and completetly different version of Gekko. We've tested it for quite a while though it might be possible that you encounter bugs. If you encounter a bug: check out in [the issues](https://github.com/askmike/gekko/issues/) if we are aware of it and if not create a new one :)

# Gekko [![Build Status](https://travis-ci.org/askmike/gekko.png)](https://travis-ci.org/askmike/gekko)

*The point is ladies and gentlemen that greed, for lack of a better word, is good.*

![Gordon Gekko](http://mikevanrossum.nl/static/gekko.jpg)

-Gordon Gekko

Gekko is a Bitcoin trading bot and backtesting platform that connects to popular Bitcoin exchanges. It is written in javascript and runs on [nodejs](http://nodejs.org). 

This is the open source do-it-yourself version, we are planning on running hosted Gekkos in the cloud which does not require you to download and install anything, configure any textfiles or deal with the commandline. If you are looking for such a solution, sign up at [Wizbit](http://wizb.it) and we'll let you know once it's open.

*Use Gekko at you own risk.*

## Main features

* Trading platform:
 * Paper trading
 * Live trading (trade bot)
 * ~~Backtester~~
* Market interface:
 * Emit market events
 * Basic IRC Bot

## Trading platform

Gekko can watch the realtime markets. You can apply automated trading methods to realtime data coming in to do live or simulated trading (automated trading or paper trading). Gekko also stores the market data it sees so you can run the trading methods with simulate trades on a set of historical data to see whether they would have been profitable during that time (backtesting).

Gekko, as well as the current bitcoin exchanges, are not built for HFT or anything related to being the fastest. The trading methods Gekko can do are based on indicators used by human day traders. The result is that Gekko does not look at data below the one minute timescale and (depending on configuration) and will normally not trade more than a couple of times per week (also depending on configuration).

**So Gekko is not**

- A trading platform for human day traders with a GUI and charts.
- A High frequency trading bot designed to operate on < minute resolution.
- A fully automated trading bot that you turn on and will generate profit withouth you having to do anything.

## Market interface

Gekko also has a plugin system that can do certain things whenever something happens or let Gekko communicate through more platforms. Gekko currently knows these plugins:

- Campfire: Enables Gekko to talk on [Campfire](https://campfirenow.com/) and report latest market data and advice.
- IRC bot: Enables Gekko to talk on IRC and report latest market data and advice.
- Mailer: Automatically sends email when your trading method has new advice.
- Profit Simulator (paper trader): Hold a fake portfolio and simulate trades based on advice.
- Redis Beacon: Broadcast events propagating through Gekko on [Redis pub/sub](http://redis.io/topics/pubsub).

## Supported exchanges

Gekko works on the following exchanges:

- Mt. Gox
- Bitstamp
- CEX.io
- Kraken ([possibly not on Windows](https://github.com/askmike/gekko/issues/202))
- BTC-e
- ~~Cryptsy~~ (In the [pipeline](https://github.com/askmike/gekko/pull/200))

## Installing Gekko

Windows user? Here is a [step-by-step guide](https://github.com/askmike/gekko/blob/master/docs/installing_gekko_on_windows.md) on how to get Gekko running on Windows.

Gekko runs on [nodejs](http://nodejs.org/), once you have that installed you can either download all files in [a zip](https://github.com/askmike/gekko/archive/master.zip) or clone the repository via git:

    git clone git://github.com/askmike/gekko.git
    cd gekko

You need to download Gekko's dependencies, which can easily be done with [npm](http://npmjs.org):

    npm install

## Configuring Gekko

> Configuring Gekko consists of three parts: 
> 
> - Watching a realtime market
> - Automate trading advice
> - Enabling plugins

Read the [configuring Gekko documentation](https://github.com/askmike/gekko/tree/localDB/docs/Configuring_gekko.md) for a detailed explanation.

## Running Gekko

To run the bot you just have to start Gekko:

    node gekko

You can also run Gekko silently, for examples on how to do this check out the [advanced features](https://github.com/askmike/gekko/tree/localDB/docs/Advanced_features.md).

## Updating Gekko

If you installed the bot via git you can easily fetch the latest updates by running:

    git pull && npm update

## TODO

* Backtester
* More exchanges (bitfinex, btcchina)
* More indicators
* Webbased interface

## Credits

* The title is inspired by [Bateman](https://github.com/fearofcode/bateman).
* This project is inspired by the [GoxTradingBot](https://github.com/virtimus/GoxTradingBot/) Chrome plugin (though no code is taken from it).

## Final

If Gekko helped you in any way, you can always leave me a tip at (BTC) 13r1jyivitShUiv9FJvjLH7Nh1ZZptumwW

## License

The MIT License (MIT)

Copyright (c) 2013 Mike van Rossum <mike@mvr.me>

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
