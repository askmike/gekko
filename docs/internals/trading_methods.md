# Trading Methods

The trading methods are the core of Gekko's trading bot. They look at the market and decide what to do based on technical analysis. The trading methods can calculate indicators on top of the market data to come up with an advice for a position to take in the market. As of now the trading method is limited to a single market on a single exchange.

Gekko currently has three indicators ready, only implementing a single indicator: DEMA, MACD and PPO. Besides those you can also create your own trading method by using javascript. The easiest way to do this is open the file `gekko/methods/custom.js` and write your own trading method.

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

## Trading method tools

In these functions you write your trading method. To help you with this Gekko has a number of tools to make it easier for you.

### Indicators

If you want to use an indicator you can add it in the `init` function and Gekko will handle the updating for you on every candle (before the update and before the check call):

    this.addIndicator('name', 'type', parameters);

The first parameter is the name, the second is the indicator type you want and the third is an object with all indicator parameters. If you want an MACD indicator you can do it like so:

In your init method:
  
    var parameters = {short: 10, long: 20, signal: 9};
    this.addIndicator('mymacd', 'MACD', parameters);

In your check or update method:

    var result = this.indicators.mymacd.result;

### Configuration parameters

[todo]

**TODO: finish documentation, for now check out the examples in `gekko/methods`.**