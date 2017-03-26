# Trading Methods

Gekko implements [technical analysis strategies](http://www.investopedia.com/articles/active-trading/102914/technical-analysis-strategies-beginners.asp) using trading methods. These methods use a number of *[indicators](http://www.investopedia.com/terms/t/technicalindicator.asp)* to calculate an *investment advice*.

This investment advice is going to be either **long** or **short**.

Below you can find simple and limited trading methods that come with Gekko. These strategies come with Gekko, for any serious usage we recommend you [write your own](trading_bot/creating_a_trading_method.md).

Gekko currently comes with:

 - [DEMA](#DEMA)
 - [MACD](#MACD)
 - [PPO](#PPO)
 - [RSI](#RSI)
 - [StochRSI](#StochRSI)
 - [CCI](#CCI)
 - [talib-macd](#talib-macd)

But you can easily create your custom method, read [here](../trading_bot/creating_a_trading_method.md) how!

### DEMA

This method uses `Exponential Moving Average crossovers` to determine the current trend the
market is in. Using this information it will suggest to ride the trend. Note that this is
not MACD because it just checks whether the longEMA and shortEMA are [threshold]% removed
from eachother.

This method is fairly popular in bitcoin trading due to Bitcointalk user Goomboo. Read more about this method in [his topic](https://bitcointalk.org/index.php?topic=60501.0)

You can configure these parameters in config/strategies/DEMA.toml:

    # EMA weight (α)
    # the higher the weight, the more smooth (and delayed) the line
    short = 10
    long = 21

    [thresholds]
    down = -0.025
    up = 0.025

- short is the short EMA that moves closer to the real market (including noise)
- long is the long EMA that lags behind the market more but is also more resistant to noise.
- the down treshold and the up treshold tell Gekko how big the difference in the lines needs to be for it to be considered a trend. If you set these to 0 each line cross would trigger new advice.

### MACD

This method is similar to DEMA but goes a little further by comparing the difference by an EMA of itself. Read more about it [here](http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:moving_average_conve).

You can configure these parameters in config/strategies/MACD.toml:

    # EMA weight (α)
    # the higher the weight, the more smooth (and delayed) the line
    short = 10
    long = 21
    signal = 9

    # the difference between the EMAs (to act as triggers)
    [thresholds]
    down = -0.025
    up = 0.025
    # How many candle intervals should a trend persist
    # before we consider it real?
    persistence = 1

- short is the short EMA that moves closer to the real market (including noise)
- long is the long EMA that lags behind the market more but is also more resistant to noise.
- signal is the EMA weight calculated over the difference from short/long.
- the down treshold and the up treshold tell Gekko how big the difference in the lines needs to be for it to be considered a trend. If you set these to 0 each line cross would trigger new advice.
- persistence tells Gekko how long the thresholds needs to be met until Gekko considers the trend to be valid.

### PPO

Very similar to MACD but also a little different, read more [here](http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:price_oscillators_pp).

You can configure these parameters in config/strategies/PPO.toml:

    # EMA weight (α)
    # the higher the weight, the more smooth (and delayed) the line
    short = 12
    long = 26
    signal = 9

    # the difference between the EMAs (to act as triggers)
    [thresholds]
    down = -0.025
    up = 0.025
    # How many candle intervals should a trend persist
    # before we consider it real?
    persistence = 2

- short is the short EMA that moves closer to the real market (including noise)
- long is the long EMA that lags behind the market more but is also more resistant to noise.
- signal is the EMA weight calculated over the difference from short/long.
- the down treshold and the up treshold tell Gekko how big the difference in the lines needs to be for it to be considered a trend. If you set these to 0 each line cross would trigger new advice.
- persistence tells Gekko how long the thresholds needs to be met until Gekko considers the trend to be valid.

### RSI

The Relative Strength Index is a momentum oscillator that measures the speed and change of price movements. Read more about it [here](http://stockcharts.com/help/doku.php?id=chart_school:technical_indicators:relative_strength_in).

You can configure these parameters in config/strategies/RSI.toml:

    interval = 14

    [thresholds]
    low = 30
    high = 70
    # How many candle intervals should a trend persist
    # before we consider it real?
    persistence = 2

- The interval is the amount of periods the RSI should use.
- The thresholds determine what level of RSI would trigger an up or downtrend.
- persistence tells Gekko how long the thresholds needs to be met until Gekko considers the trend to be valid.

### StochRSI

You can configure these parameters in config/strategies/StochRSI.toml:

    interval = 3

    [thresholds]
    low = 20
    high = 80
    persistence = 3

[TODO!]

You can configure these parameters in config/strategies/StochRSI.toml:

### CCI

    # constant multiplier. 0.015 gets to around 70% fit
    constant = 0.015

    # history size, make same or smaller than history
    history = 90

    [thresholds]
    up = 100
    down = -100
    persistence = 0

[TODO!]

### talib-macd

    [parameters]
    optInFastPeriod = 10
    optInSlowPeriod = 21
    optInSignalPeriod = 9

    [thresholds]
    down = -0.025
    up = 0.025

[TODO!]