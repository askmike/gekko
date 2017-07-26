# Gekko indicators

When [creating your own strategy](./creating_a_strategy.md) there are a few built in indicators you can use that ship with Gekko.

## Example

If you want to use the MACD indicator from Gekko, you need to register it in your strategy like so:

    method.init = function() {
      var settings = {
        short: 10,
        long: 21,
        signal: 9
      };

      // add the indicator to the strategy
      this.addIndicator('mymacd', 'MACD', settings);
    }

    method.check = function() {
      // use indicator results
      var macdiff = this.indicators.mymacd.result;

      // do something with macdiff
    }

## Indicators

Here is a list of all supported indicators, click on them to read more about what they are and how to implement them in Gekko:

- [EMA](#ema)
- [PPO](#ppo)
- [CCI](#cci)
- [DEMA](#dema)
- [LRC](#lrc)
- [MACD](#macd)
- [RSI](#rsi)
- [SMA](#sma)
- [TSI](#tsi)
- [UO](#UO)

### EMA

> **What is an 'Exponential Moving Average - EMA'**
> An exponential moving average (EMA) is a type of moving average that is similar to a simple moving average, except that more weight is given to the latest data. It's also known as the exponentially weighted moving average. This type of moving average reacts faster to recent price changes than a simple moving average.

*[More info on investopedia](http://www.investopedia.com/terms/e/ema.asp).*

You can implement the EMA like so:

    method.init = function() {
      var weight = 10;

      // add the indicator to the strategy
      this.addIndicator('myema', 'EMA', weight);
    }

    method.check = function() {
      // use indicator results
      var ema = this.indicators.myema.result;

      // do something with macdiff
    }


### PPO

[todo]

### CCI

[todo]

### DEMA

[todo]

### LRC

[todo]

### MACD

[todo]

### RSI

[todo]

### SMA

[todo]

### TSI

[todo]

### UO

[todo]