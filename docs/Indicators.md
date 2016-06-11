

### DEMA

This method uses `Exponential Moving Average crossovers` to determine the current trend the
market is in. Using this information it will suggest to ride the trend. Note that this is
not MACD because it just checks whether the longEMA and shortEMA are [threshold]% removed
from eachother.

This method is fairly popular in bitcoin trading due to Bitcointalk user Goomboo. Read more about this method in [his topic](https://bitcointalk.org/index.php?topic=60501.0)

You can configure these parameters for DEMA in config.js:

    config.DEMA = {
      // EMA weight (α)
      // the higher the weight, the more smooth (and delayed) the line
      short: 10,
      long: 21,
      // amount of candles to remember and base initial EMAs on
      // the difference between the EMAs (to act as triggers)
      thresholds: {
        down: -0.025,
        up: 0.025
      }
    };

- short is the short EMA that moves closer to the real market (including noise)
- long is the long EMA that lags behind the market more but is also more resistant to noise.
- the down treshold and the up treshold tell Gekko how big the difference in the lines needs to be for it to be considered a trend. If you set these to 0 each line cross would trigger new advice.

### MACD

This method is similar to DEMA but goes a little further by comparing the difference by an EMA of itself. Read more about it [here](http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:moving_average_conve).

You can configure these parameters for MACD in config.js:

    // MACD settings:
    config.MACD = {
      // EMA weight (α)
      // the higher the weight, the more smooth (and delayed) the line
      short: 10,
      long: 21,
      signal: 9,
      // the difference between the EMAs (to act as triggers)
      thresholds: {
        down: -0.025,
        up: 0.025,
        // How many candle intervals should a trend persist
        // before we consider it real?
        persistence: 1
      }
    };

- short is the short EMA that moves closer to the real market (including noise)
- long is the long EMA that lags behind the market more but is also more resistant to noise.
- signal is the EMA weight calculated over the difference from short/long.
- the down treshold and the up treshold tell Gekko how big the difference in the lines needs to be for it to be considered a trend. If you set these to 0 each line cross would trigger new advice.
- persistence tells Gekko how long the thresholds needs to be met until Gekko considers the trend to be valid.

### PPO

Very similar to MACD but also a little different, read more [here](http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:price_oscillators_pp).

    // PPO settings:
    config.PPO = {
      // EMA weight (α)
      // the higher the weight, the more smooth (and delayed) the line
      short: 12,
      long: 26,
      signal: 9,
      // the difference between the EMAs (to act as triggers)
      thresholds: {
        down: -0.025,
        up: 0.025,
        // How many candle intervals should a trend persist
        // before we consider it real?
        persistence: 2
      }
    };

- short is the short EMA that moves closer to the real market (including noise)
- long is the long EMA that lags behind the market more but is also more resistant to noise.
- signal is the EMA weight calculated over the difference from short/long.
- the down treshold and the up treshold tell Gekko how big the difference in the lines needs to be for it to be considered a trend. If you set these to 0 each line cross would trigger new advice.
- persistence tells Gekko how long the thresholds needs to be met until Gekko considers the trend to be valid.

### RSI

The Relative Strength Index is a momentum oscillator that measures the speed and change of price movements. Read more about it [here](http://stockcharts.com/help/doku.php?id=chart_school:technical_indicators:relative_strength_in). Configure it like so:

    // RSI settings:
    config.RSI = {
      interval: 14,
      thresholds: {
        low: 30,
        high: 70,
        // How many candle intervals should a trend persist
        // before we consider it real?
        persistence: 1
      }
    };

- The interval is the amount of periods the RSI should use.
- The thresholds determine what level of RSI would trigger an up or downtrend.
- persistence tells Gekko how long the thresholds needs to be met until Gekko considers the trend to be valid.