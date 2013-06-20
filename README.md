# Gekko

*The point is ladies and gentlemen that greed, for lack of a better word, is good.*

![Gordon Gekko](http://mikevanrossum.nl/static/gekko.jpg)

-Gordon Gekko

Gekko is a Bitcoin trading bot for popular exchanges written in javascript running on [nodejs](http://nodejs.org), it will feature multiple trading methods using technical analysis (at this moment it only knows EMA).

## Main features

Gekko uses technical analysis (only EMA at this moment) to determine when to enter or leave the market, at such a moment it can:

* Advice on what you should do (for example per email).
* Calculate the profits of all the advices so far.
* Automatically trade.

Gekko currently supports automatic trading at the following exchanges:
* [Mt. Gox](https://mtgox.com/)
* [BTC-e](https://btc-e.com/) (alpha stage)
* [Bitstamp](https://bitstamp.net) (alpha stage)

## What?

This project is a learning excercise of me, a student with *some* experience in programming (mostly web) and zero experience in economics and trading. I figured writing my own trade bot would be the best way to learn about implementing mathematical trading algorithms. So here is **my very first attempt at anything related to trading / algorithmic decision making**.

I'm developing Gekko fully open source in the hope of getting feedback from folks with more experience in this field. Because I not only want to attract programmers I am doing my best to make the code as readable as possible, this includes a lot of comments and probably not the most efficient (but expressive) code.

As this is a learning experience for me all feedback is extremely appreciated. If you don't want to contribute to the code you can always just send me an [email](mailto:mike@mvr.me) or leave feedback in the [Gekko thread on the bitcointalk forum](https://bitcointalk.org/index.php?topic=209149.0).

*Use Gekko at you own risk.*

## Install

Windows users? Here is a [step-by-step guide](https://github.com/askmike/gekko/blob/master/docs/installing_gekko_on_windows.md) on how to get Gekko running.

Gekko runs on [nodejs](http://nodejs.org/), once you have that installed you can either download all files in [a zip](https://github.com/askmike/gekko/archive/master.zip) or clone the repository via git:

    git clone git://github.com/askmike/gekko.git
    cd gekko

You need to download Gekko's dependencies, which can easily be done with [npm](http://npmjs.org):

    npm install

To change the settings, open up and edit [config.js](https://github.com/askmike/gekko/blob/master/config.js) to change the parameters. Check out doc on [Configuring Gekko](https://github.com/askmike/gekko/blob/master/docs/Configuring_gekko.md) where everything is explained in more detail.

To run the bot you just have to start Gekko:

    node gekko

You can also run Gekko silently, for examples on how to do this check out the [advanced features](https://github.com/askmike/gekko/blob/master/docs/Advanced_features.md).

If you installed the bot via git you can easily fetch the latest updates by running:

    git pull && npm update

## What is Gekko doing?

If you started Gekko it will remain open in your terminal and log out new information, for example:

    start time:  2013-05-19 23:17:38

    I'm gonna make you rich, Bud Fox.
    Let me show you some Exponential Moving Averages.

    2013-06-02 18:21:15 (INFO): ADVICE is to HOLD @ 117.465 (0.132)
    2013-06-02 18:21:15 (INFO): (PROFIT REPORT) original balance:    207.465 USD
    2013-06-02 18:21:15 (INFO): (PROFIT REPORT) current balance:     217.465 USD
    2013-06-02 18:21:15 (INFO): (PROFIT REPORT) profit:          10.000 USD (4.820%)

After the first fetching, every new interval (in the [config](https://github.com/askmike/gekko/blob/master/config.js#L17)) Gekko will fetch new trade data, advice on what to do and give a profit report:

### Advice

* HOLD means don't do anything, we are either not in a trend or the trend has not changed since last check.
* BUY means the trend has changed to an uptrend, advice is to buy now so we can sell at the end of the trend.
* SELL means the trend has chacnged to a downtrend, advice is to sell now so we can buy back at the end of the trend.

After every line of advice we can see the current price Gekko calculated and the difference in EMAs, this makes it easier to understand the advice.

### Profit report

The profit report will log out Gekko's profit since it started, this is done using a buy and sell simulations (regardless if you have automatic trading enabled or not). **The profit does not take fees into account.**

*If Gekko logs 20% that means that if you would have had automatic trading enabled on an exchange account with a balance of 1BTC, you would now have 1.2BTC (minus the exchange fees for the trades).*

### Buying and selling

If you configured Gekko to automatically sell on this information it will also log:

* NOW going to BUY, when it is buying BTC.
* NOW going to SELL, when it is selling BTC.

It will try to buy/sell 1000 BTC, Mt. Gox and BTC-e change this in to all the funds on your account (unless you're pretty rich).

## TODO

* Create an easy way to backtest historical data and determine the effectiveness of different paramters.
* Add more exchanges (such as [bitfloor](https://npmjs.org/package/bitfloor), [campBX](https://npmjs.org/package/campbx)).
* Store trade history in levelDB.
* Add money management (so that the bot will only spend a start amount of X and the profits on top of X).

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
