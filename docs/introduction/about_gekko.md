# About Gekko

Gekko is a **free and open source** Bitcoin TA trading and backtesting platform that connects to popular Bitcoin exchanges. It is written in javascript and runs on [nodejs](http://nodejs.org).

*Use Gekko at your own risk.*

![Gordon Gekko](https://mikevanrossum.nl/static/gekko.jpg)

*The most valuable commodity I know of is information.*

-Gordon Gekko

## Main features

* Automated trading (trade bot)
* Paper trading (for TA strategies)
* [Backtester](../features/backtesting.md) (for TA strategies)
* Tool for systematic trading
* Low level market library
 * Monitor the live market
 * Import historical market data
 * Broadcast market data over pubsub messaging systems
* Web interface as well as a commandline interface

![screenshot of gekko ui](https://cloud.githubusercontent.com/assets/969743/23837675/a95da120-0783-11e7-9cab-6a209d4c928e.png)

## TA strategies

Gekko comes with some [example strategies](../strategies/example_strategies.md) (which implement a single indicator). But with some basic javascript you can [create your own strategies](../strategies/creating_a_strategy.md). You can use over 130 indicators to create your perfect prediction model ([full list](../strategies/talib_indicators.md) of supported indicators). *Why don't you combine Bollinger Bands, CCI and MACD with a STOCHRSI indicator?*

## Automated Trading platform

Gekko can watch the realtime markets, you can TA strategies to do live or simulated trading. Gekko stores all market data it sees, this makes it possible to simulate trading strategies against historical data to see whether they would have been profitable (backtesting).

Gekko is not built for HFT or anything related to being the fastest (like arbitrage). The trading methods Gekko can do are based on TA indicators used by human day traders. This means that Gekko does not look at data below the one minute timescale and will not trade more than a couple of times per week (depending on configuration).

## Gekko is not

- A trading platform for human day traders (although it can be used to support human traders)
- A High frequency trading bot designed to operate on < minute resolution
- A fully automated trading bot that you turn on and will generate profit without you having to do anything
- An exchange
- An arbitrage bot

## How does Gekko work?

![Gekko architecture](https://wizb.it/gekko/static/architecture.jpg)

Read more in the [architecture documentation](../internals/architecture.md).

## Credits

* The title is inspired by [Bateman](https://github.com/fearofcode/bateman).
* This project is inspired by the [GoxTradingBot](https://github.com/virtimus/GoxTradingBot/) Chrome plugin (which in turn is inspired by [Goomboo's journal](https://bitcointalk.org/index.php?topic=60501.0)).

## Final

If Gekko helped you in any way, you can always leave me a tip at (BTC) 13r1jyivitShUiv9FJvjLH7Nh1ZZptumwW

## Disclaimer

Gekko (nor anyone behind this project) DOES NOT give investment advice. All advice seen within Gekko is the result of running YOUR OWN strategies against the market. On top of that there might be bugs in the code - Gekko DOES NOT come with ANY warranty.

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
