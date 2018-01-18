# Creating a strategy

Strategies are the core of Gekko's trading bot. They look at the market and decide what to do based on technical analysis indicators. As of now all strategies are limited to a single market on a single exchange.

Gekko currently comes with [a couple of strategies](./example_strategies.md) out of the box. Besides those you can also write your own strategy in javascript. The easiest way to do this is to customize the file `gekko/strategies/custom.js`.

## Creating a strategy

A strategy is a combination of functions that get market data in the form of candles ([OHLC](https://en.wikipedia.org/wiki/Open-high-low-close_chart), volume, and the average weighted price).

## Boilerplate strategies

    // Let's create our own strategy
    var strat = {};

    // Prepare everything our strat needs
    strat.init = function() {
      // your code!
    }

    // What happens on every new candle?
    strat.update = function(candle) {
      // your code!
    }

    // For debugging purposes.
    strat.log = function() {
      // your code!
    }

    // Based on the newly calculated
    // information, check if we should
    // update or not.
    strat.check = function(candle) {
      // your code!
    }

    // Optional for executing code
    // after completion of a backtest.
    // This block will not execute in
    // live use as a live gekko is
    // never ending.
    strat.end = function() {
      // your code!
    }

    module.exports = strat;

The above boilerplate contains four functions that must be completed. The functions are executed like so:

- On startup: run init.
- On each new candle: run update.
 - if required history has been built (See `check()` function below): run log, run check.

### init function

Executed when the trading strategy starts. Initialize trading parameters here.

### update function

This function executes on every new candle.  Refresh trading parameters here.

### log function

The log function is executed when the `debug` flag configuration is on (Set this in the config). Logging is used to trace parameter values as the `init` and `update` functions are executed over time.

### check function

Most strategies need a minimal amount of history before the trading strategy can be started.  For example the strategy may be calculating a moving average for the first 3 candles, so it must have at least 3 candles to start.  The check function is executed after the required history period is over. The default required history is 0. You can set it like so in your init function:

    this.requiredHistory = 5; // require 5 candles before giving advice

If you find out in the check function that you want to give new advice to the trader you can use the advice function:

    this.advice('short');
    // or
    this.advice('long');
    
### candle variables

The following list of candle variables can be used when writing strategies:

 - candle.close: the closing price of the candle
 - candle.high: the highest price of the candle
 - candle.low: the lowest price of the candle
 - candle.volume: the trading volume of that candle
 - candle.trades: number of trades in that candle
 
Keep in mind that these variables will give you different results depending on the time window set (1 minute, 15 minutes, 1 hour, etc.) for constructing the candle.


### basic strategy example

This a basic strategy example that buys and sells BTC/USDT when it hits a specific price.

    // Let's create our own buy and sell strategy 
    var strat = {};

    // Prepare everything our strat needs
    strat.init = function() {
      // setting buy price
      this.buyPrice = 2000;
      
      // setting sell price
      this.sellPrice = 2500;
    }

    // What happens on every new candle?
    strat.update = function(candle) {
      // your code!
    }

    // For debugging purposes.
    strat.log = function() {
      // your code!
    }

    // Based on the newly calculated
    // information, check if we should
    // update or not.
    strat.check = function(candle) {
        // buy when it hits buy price
        if(candle.close <= this.buyPrice) {
            this.advice("long");
            // do some output
            console.log("buying BTC @", candle.close);
            return;
        }
        
        // sell when it hits sell price
        if(candle.close >= this.sellPrice) {
            this.advice("short");
            // do some output
            console.log("selling BTC @", candle.close);
            console.log("Profit:", (candle.close-this.buyPrice));
            return;
        }
    }

    module.exports = strat;

## Strategy rules

- You can activate your own strategy by setting `config.tradingAdvisor.strategy` to `custom` (or whatever you named your file inside the `gekko/strategies`) in the loaded config.
- Gekko will execute the `update` function for every new candle. A candle is the size in minutes configured at `config.tradingAdvisor.candleSize` in the loaded config.
- It is advised to set history `config.tradingAdvisor.historySize` the same as the requiredHistory as Gekko will use this property to create an initial batch of candles.
- Never rely on anything based on system time because each method can run on live markets as well as during backtesting. You can look at the `candle.start` property which is a `moment` object of the time the candles started.

## Strategy tools

To help you Gekko has a number of strategy tools.

### Indicators

Gekko supports a few indicators natively, in addition to the integration of indicators from the library [TA-lib](http://ta-lib.org/).

#### Example usage

If you want to use an indicator you can add it in the `init` function and Gekko will handle the updating for you on every candle (before the update and before the check call):

    // add a native indicator
    this.addIndicator('name', 'type', parameters);

or

    // add a TA-lib indicator
    this.addTalibIndicator('name', 'type', parameters);

or

    // add a Tulip indicator
    this.addTulipIndicator('name', 'type', parameters);

The first parameter is the name, the second is the indicator type you want and the third is an object with all indicator parameters. If you want an MACD indicator you can do it like so:

In your init method:
  
    // add a native indicator
    var parameters = {short: 10, long: 20, signal: 9};
    this.addIndicator('mynativemacd', 'MACD', parameters);

    // add a TA-lib indicator
    var parameters = {optInFastPeriod: 10, optInSlowPeriod: 21, optInSignalPeriod: 9};
    this.addTalibIndicator('mytalibmacd', 'macd', parameters);

    // add a Tulip indicator
    var parameters = {optInFastPeriod: 10, optInSlowPeriod: 21, optInSignalPeriod: 9};
    this.addTulipIndicator('mytulipmacd', 'macd', parameters);

In your check or update method:

    var result = this.indicators.mytalibmacd.result;

See the [TA-lib indicators](./talib_indicators.md) document for a list of all suppported TA-lib indicators and their required parameters.

See the [Tulip indicators](./tulip_indicators.md) document for a list of all supported Tulip indicators and their required parameters.

### Configurables

Adjust method execution by creating custom configuration parameters.  This way the same method can execute strategies concurrently using different parameters for different markets.  Create custom configuration settings in the `config/strategies` directory:

    // custom settings:
    config.custom = {
      my_custom_setting: 10,
    };

Retrieve them in your method like this:

    // anywhere in your code:
    log.debug(this.settings.my_custom_setting); // Logs 10

___Note that the name of your configuration must be the same as the name of the strategy___

### Tool libraries

Gekko uses a few general purpose libraries internally.  The API from those libraries are available to you as well.  Most notable libraries are [lodash](http://lodash.com/) (similar as underscore) and [async](https://github.com/caolan/async).

You can load them like so:

    // before any methods
    var _ = require('lodash');
    var async = require('async');

### Logging

Gekko has a small logger you can use (preferably in your log method):

    // before any methods
    var log = require('../core/log.js');

    // in your log method
    log.debug('hello world');


-----

Take a look at the existing methods, if you have questions feel free to create an issue. If you created your own awesome trading method and want to share it with the world feel free to contribute it to gekko.
