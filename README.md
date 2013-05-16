# Gekko

*The point is ladies and gentlemen that greed, for lack of a better word, is good.*

![Gordon Gekko](http://mikevanrossum.nl/static/gekko.jpg)

-Gordon Gekko

Gekko is *going to be* a Bitcoin trading bot for [Mt. Gox](http://mtgox.com) written in node, it will feature multiple trading methods using technical analysis.

## What?

This project is a learning excercise of me, a student with *some* experience in programming (mostly web) and zero experience in economics and trading. I figured writing my own trade bot would be the best way to learn about implementing mathematical trading algorithms. So here is **my very first attempt at anything related to trading / algorithmic decision making**.

I'm developing Gekko fully open source in the hope of getting feedback from folks with more experience in this field. Because I not only want to attract programmers I am doing my best to make the code as readable as possible, this includes a lot of comments and probably not the most efficient (but expressive) code.

As this is a learning experience for me all feedback is extremely appreciated. If you don't want to contribute to the code you can always just send me an [email](mailto:mike@mvr.me).

## Disclaimer

Use Gekko at you own risk.

## Install

*Gekko is currently not at a working stage yet.*

Gekko runs on [nodejs](http://nodejs.org/), once you have that running you can either download all files in [a zip](https://github.com/askmike/gekko/archive/master.zip) or clone the repository via git:

    git clone git://github.com/askmike/gekko.git

## TODO

* Create a working Exponential moving average algorithm.
* Add the ability to use different exchanges (such as [btc-e](https://npmjs.org/package/btc-e)).
* Add an option to run the bot without buying or selling, but merely gather statistics.
* Figure out a way to calculate the succes rate of a method based on historical data.

## Credits

* The title is inspired by [Bateman](https://github.com/fearofcode/bateman).
* This project is inspired by the [GoxTradingBot](https://github.com/virtimus/GoxTradingBot/) Chrome plugin.