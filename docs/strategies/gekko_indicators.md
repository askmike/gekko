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
> "An exponential moving average (EMA) is a type of moving average that is similar to a simple moving average, except that more weight is given to the latest data. It's also known as the exponentially weighted moving average. This type of moving average reacts faster to recent price changes than a simple moving average."

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
> **What is the 'Percentage Price Oscillator - PPO'** 
> "The percentage price oscillator (PPO) is a technical momentum indicator showing the relationship between two moving averages." 

*[More info on investopedia](https://www.investopedia.com/terms/p/ppo.asp).*

### CCI
> **What is the 'Commodity Channel Index - CCI'**
> "The Commodity Channel Index​ (CCI) is a momentum based technical trading tool used most often to help determine when an investment vehicle is reaching a condition of being overbought or oversold."

*[More info on investopedia](https://www.investopedia.com/terms/c/commoditychannelindex.asp).*

### DEMA

> **What is the 'Double Exponential Moving Average - DEMA'**
> "The DEMA is a fast-acting moving average that is more responsive to market changes than a traditional moving average. It was developed in an attempt to create a calculation that eliminated some of the lag associated with traditional moving averages."

*[More info on investopedia](https://www.investopedia.com/terms/d/double-exponential-moving-average.asp).*

### LRC

> **What is the 'Linear Regression Channel - LRC'**
> "This indicator plots a line that best fits the prices specified over a user-defined time period. The Linear Regression Curve is used mainly to identify trend direction and is sometimes used to generate buy and sell signals."

*[More info on Interactive Brokers](https://www.interactivebrokers.co.uk/en/software/tws/usersguidebook/technicalanalytics/linearregressioncurve.htm).*

### MACD
> **What is the 'Moving Average Convergence Divergence - MACD'**
> "Moving average convergence divergence (MACD) is a trend-following momentum indicator that shows the relationship between two moving averages of prices."

*[More info on investopedia](https://www.investopedia.com/terms/m/macd.asp).*

### RSI
> **What is the 'Relative Strength Index - RSI'**
> "Compares the magnitude of recent gains and losses over a specified time period to measure speed and change of price movements of a security. It is primarily used to attempt to identify overbought or oversold conditions in the trading of an asset."

*[More info on investopedia](https://www.investopedia.com/terms/r/rsi.asp).*

### SMA
> **What is the 'Simple Moving Average - SMA'**
> "A simple moving average (SMA) is an arithmetic moving average calculated by adding the closing price of the security for a number of time periods and then dividing this total by the number of time periods."

*[More info on investopedia](https://www.investopedia.com/terms/s/sma.asp).*

### TSI

> **What is the 'True Strength Index - TSI'**
> "A technical momentum indicator that helps traders determine overbought and oversold conditions of a security by incorporating the short-term purchasing momentum of the market with the lagging benefits of moving averages."

*[More info on investopedia](https://www.investopedia.com/terms/t/tsi.asp).*

### UO

> **What is the 'Ultimate Oscillator - UO'**
> "A technical indicator that uses the weighted average of three different time periods to reduce the volatility and false transaction signals that are associated with many other indicators that mainly rely on a single time period"

*[More info on investopedia](https://www.investopedia.com/terms/u/ultimateoscillator.asp).*

