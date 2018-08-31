# Creating a strategy

Strategies are the core of Gekko's trading bot. They look at the market and decide what to do based on technical analysis indicators. A single strategy is limited to a single market on a single exchange.

Gekko currently comes with [a couple of strategies](./introduction.md) out of the box. Besides those you can also write your own strategy in javascript. If you want to understand how to create your own strategy you can watch this video or read the tech docs on this page.

[![youtube video on how to create gekko strategies](https://gekko.wizb.it/_static/create-strat-vid.jpg)](https://www.youtube.com/watch?v=6-74ZhrG0BE)

A strategy is a module with a few functions that get market data in the form of candles ([OHLC](https://en.wikipedia.org/wiki/Open-high-low-close_chart), volume, and the average weighted price) and output trading advice.

## Strategy boilerplate

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

# Strategy lifecycle methods

The above boilerplate contains four functions. These functions are executed by Gekko like so:

- When Gekko starts: run init.
- On each new candle:
  - run [update](#update-function)
  - once the strategy has completed warmup:
    - run [log](#log-function)
    - run [check](#check-function)

### init function

Executed when the trading strategy starts. Your strategy can initialize state and [register indicators](#Indicators).

### update function

This function executes on every new candle. You can access the latest candle as the first (and only) parameter (it's also stored in `this.candle`).

### log function

The log function is executed on every new candle when the `debug` flag is on (always off when running in the UI, as configured in [the config](../commandline/about_the_commandline.md) for CLI gekkos). Logging is used to log certain state from the strategy and can be used to debug your strategy to get more insights in why it took certain decisions.

### check function

Most strategies need to warmup before the trading strategy can be started. For example the strategy may be calculating a moving average for the first 3 candles, as such it must have at least 3 candles to output a number the strategy logic relies on. The check function is executed after the warmup period is over. The default required history is 0. You can set it like so in your init function:

    this.requiredHistory = 5; // require 5 candles before giving advice

If you find out in the check function that you want to give new advice to the trader you can use the advice function:

    this.advice({
      direction: 'long' // or short
      trigger: { // ignored when direction is not "long"
        type: 'trailingStop',
        trailPercentage: 5
        // or:
        // trailValue: 100
      }
    });

The trigger is optional, if the direction is long and the trigger is specified as a trailingStop this will request the trader to create a trail stop trigger.

### candle variable

The following list of candle variables will be available when writing strategies, they are part of the candle object which is given to your `update` and `check` functions (it's also accessable through `this.candle`).

 - candle.close: the closing price of the candle
 - candle.high: the highest price of the candle
 - candle.low: the lowest price of the candle
 - candle.volume: the trading volume of that candle
 - candle.trades: number of trades in that candle

## Things to keep in mind

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

In your init function:

    // add a native indicator
    var parameters = {short: 10, long: 20, signal: 9};
    this.addIndicator('mynativemacd', 'MACD', parameters);

    // add a TA-lib indicator
    var parameters = {optInFastPeriod: 10, optInSlowPeriod: 21, optInSignalPeriod: 9};
    this.addTalibIndicator('mytalibmacd', 'macd', parameters);

    // add a Tulip indicator
    var parameters = {optInFastPeriod: 10, optInSlowPeriod: 21, optInSignalPeriod: 9};
    this.addTulipIndicator('mytulipmacd', 'macd', parameters);

In your check or update function:

    var result = this.indicators.mytalibmacd.result;

See the [TA-lib indicators](./talib_indicators.md) document for a list of all supported TA-lib indicators and their required parameters.

See the [Tulip indicators](./tulip_indicators.md) document for a list of all supported Tulip indicators and their required parameters.

### Strategy parameters

Adjust strategy execution by creating custom strategy parameters. This way the same strategy can execute strategies concurrently using different parameters for different markets. For example the MACD strategy has parameters concerning the underlying MACD indicator (such as values for the LONG and SHORT EMAs). Create custom configuration settings in the `config/strategies` directory:

    // custom settings:
    config.custom = {
      my_custom_setting: 10,
    };

Retrieve them in your strategy like this:

    // anywhere in your code:
    log.debug(this.settings.my_custom_setting); // Logs 10

___Note that the name of your configuration must be the same as the name of the strategy___

### External libraries

Gekko uses a few general purpose libraries internally.  The API from those libraries are available to you as well.  Most notable libraries are [lodash](http://lodash.com/) (similar as underscore) and [async](https://github.com/caolan/async).

You can load them like so:

    // before any other code
    var _ = require('lodash');
    var async = require('async');

### Logging

Gekko has a small logger you can use (preferably in your log function):

    // before any other code
    var log = require('../core/log.js');

    // in your log function
    log.debug('hello world');


-----

Take a look at the existing methods, if you have questions feel free to create an issue. If you created your own awesome strategies and want to share it with the world feel free to contribute it to gekko.
