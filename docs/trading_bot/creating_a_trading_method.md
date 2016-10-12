# Trading Methods

The trading methods are the core of Gekko's trading bot. They look at the market and decide what to do based on technical analysis indicators. As of now the trading method is limited to a single market on a single exchange.

Gekko currently comes with [a couple of methods](../Trading_methods.md) out of box. Besides those you can also create your own trading method by using javascript. The easiest way to do this is open the file `gekko/methods/custom.js` and write your own trading method.

## Creating a trading method

A trading method is a combination of functions that get market data in the form of candles (OHCL, volume and the average weighted price).

## Boiler plate trading method

    // Let's create our own method
    var method = {};

    // Prepare everything our method needs
    method.init = function() {
      // your code!
    }

    // What happens on every new candle?
    method.update = function(candle) {
      // your code!
    }

    // For debugging purposes.
    method.log = function() {
      // your code!
    }

    // Based on the newly calculated
    // information, check if we should
    // update or not.
    method.check = function() {
      // your code!
    }

    module.exports = method;

In the boilerplate we define four functions you have to write yourself. The functions are executed like this:

- On starup: run init.
- On new candle: run update.
 - if required history has been build: run log, run check.

### init function

This function is exectuted when Gekko prepares your method, here you can initilalize some stuff you need later on. For example if you need to keep state between new candles.

### update function

This function executes on every new candle, you can do your own calculations on the candle here.

### log function

The log function is executed when the `debug` flag is on in the config, you can use this to log some numbers you've calculated which will make it easier to troubleshoot why your method acted the way it did.

### check function

The check function is executed after the required history period is over: Most methods can't start right away but need a number of candles before they can start giving advice (like when you want to calculate averages). The default required history is 0. You can set it like so in your init function:

    this.requiredHistory = 5; // require 5 candles before giving advice

If you find out in the check function that you want to give a new advice to the trader or any other part you can use the advice function:

    this.advice('short');
    // or
    this.advice('long');

## Trading method rules

- You can activate your own method by setting `config.tradingAdvisor.method` to `custom` (or whatever you named your script inside the `gekko/methods`) in the loaded config.
- Gekko will execute the functions for every candle. A candle is the size in minutes configured at `config.tradingAdvisor.candleSize` in the loaded config.
- It is advised to set history `config.tradingAdvisor.historySize` the same as the requiredHistory as Gekko will use this property to create an initial batch of candles.
- Never rely on anything based on system time because each method can run on live markets as well as during backtesting.

## Trading method tools

In these functions you write your trading method. To help you with this Gekko has a number of tools to make it easier for you.

### Indicators

If you want to use an indicator you can add it in the `init` function and Gekko will handle the updating for you on every candle (before the update and before the check call):

    this.addIndicator('name', 'type', parameters);

or

    this.addTalibIndicator('name', 'type', parameters);

The first parameter is the name, the second is the indicator type you want and the third is an object with all indicator parameters. If you want an MACD indicator you can do it like so:

In your init method:
  
    var parameters = {short: 10, long: 20, signal: 9};
    this.addIndicator('mymacd', 'MACD', parameters);

In your check or update method:

    var result = this.indicators.mymacd.result;

Currently supported native indicators can be found [here](https://github.com/askmike/gekko/tree/stable/methods/indicators), all talib indicators (100+) can be found [here](http://ta-lib.org/function.html).

### Configurables

You can create configurable parameters for your method which allows you to adjust the behaviour for your trading method. This way you can create one method but have different implementations running at the same time on different markets. You can achieve this by creating some parameters which can be changed in the config.js file:

    // custom settings:
    config.custom = {
      my_custom_setting: 10,
    };

And in your method you can use them again (for example to pass to an indicator):

    // in the init:
    var config = require('../core/util.js').getConfig();
    this.settings = config.custom;

    // anywhere in your code:
    this.settings.my_custom_setting; // is now 10

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