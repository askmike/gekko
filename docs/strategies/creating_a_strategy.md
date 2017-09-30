# Creating a strategy

Strategies are the core of Gekko's trading bot. They look at the market and decide what to do based on technical analysis indicators. As of now all strategies are limited to a single market on a single exchange.

Gekko currently comes with [a couple of strategies](./example_strategies.md) out of box. Besides those you can also create your own strategy in javascript. The easiest way to do this is open the file `gekko/strategies/custom.js` and write your own trading method.

## Creating a strategy

A strategy is a combination of functions that get market data in the form of candles (OHCL, volume and the average weighted price).

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

In the boilerplate we define four functions you have to write yourself. The functions are executed like so:

- On starup: run init.
- On new candle: run update.
 - if required history has been build: run log, run check.

### init function

This function is executed when Gekko prepares your method, here you can initialize some stuff you need later on. For example if you need to keep state between new candles.

### update function

This function executes on every new candle, you can do your own calculations on the candle here.

### log function

The log function is executed when the `debug` flag is on in the config, you can use this to log some numbers you've calculated which will make it easier to troubleshoot why your strategy acted the way it did.

### check function

The check function is executed after the required history period is over: Most strategies can't start right away but need a number of candles before they can start giving advice (like when you want to calculate averages). The default required history is 0. You can set it like so in your init function:

    this.requiredHistory = 5; // require 5 candles before giving advice

If you find out in the check function that you want to give a new advice to the trader or any other part you can use the advice function:

    this.advice('short');
    // or
    this.advice('long');
    
### candle variables when creating your strategy

You can use different candle variables when writing your strategies, depending on what you have in mind, using additional variables might help you to improve your results.

Possible candle variables are:
 - candle.close: the closing price of the candle
 - candle.high: the highest price of the candle
 - candle.low: the lowest price of the candle
 - candle.volume: the trading volume of that candle
 - candle.trades: number of trades in that candle
 
Keep in mind that this variables will give you different results depending on the candle-size you're using.


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
    strat.check = function() {
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
- Gekko will execute the functions for every candle. A candle is the size in minutes configured at `config.tradingAdvisor.candleSize` in the loaded config.
- It is advised to set history `config.tradingAdvisor.historySize` the same as the requiredHistory as Gekko will use this property to create an initial batch of candles.
- Never rely on anything based on system time because each method can run on live markets as well as during backtesting. You can look at the `candle.start` property which is a `moment` object of the time the candles started.

## Strategy tools

To help you Gekko has a number of tools to make it easier:

### Indicators

Gekko supports a few indicators natively, but also supports integration with the great library [TA-lib](http://ta-lib.org/).

#### Example usage

If you want to use an indicator you can add it in the `init` function and Gekko will handle the updating for you on every candle (before the update and before the check call):

    // add a native indicator
    this.addIndicator('name', 'type', parameters);

or

    // add a TA-lib indicator
    this.addTalibIndicator('name', 'type', parameters);

The first parameter is the name, the second is the indicator type you want and the third is an object with all indicator parameters. If you want an MACD indicator you can do it like so:

In your init method:
  
    // add a native indicator
    var parameters = {short: 10, long: 20, signal: 9};
    this.addIndicator('mynativemacd', 'MACD', parameters);

    // add a TA-lib indicator
    var parameters = {optInFastPeriod: 10, optInSlowPeriod: 21, optInSignalPeriod: 9};
    this.addIndicator('mytalibmacd', 'MACD', parameters);

In your check or update method:

    var result = this.indicators.mytalibmacd.result;

See the [TA-lib indicators](https://github.com/askmike/gekko/blob/stable/docs/trading_bot/talib_indicators.md) document for a list of all suppported TA-lib indicators and there required parameters.

### Configurables

You can create configurable parameters for your method which allows you to adjust the behaviour for your trading method. This way you can create one method but have different implementations running at the same time on different markets. You can achieve this by creating some parameters which can be changed in the `config/strategies` directory:

    // custom settings:
    config.custom = {
      my_custom_setting: 10,
    };

And in your method you can use them again (for example to pass to an indicator):

    // anywhere in your code:
    this.settings.my_custom_setting; // is now 10

___The name of your configuration must be the same as the name of the strategy___

### Tool libraries

Gekko uses a few general purpose libraries a lot internally, you can use those in your methods as well. Most notable libraries are [lodash](http://lodash.com/) (similar as underscore) and [async](https://github.com/caolan/async).

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
