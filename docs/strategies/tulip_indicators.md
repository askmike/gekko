# Tulip indicators

When writing [your own strategy](./creating_a_trading_method.md) you can use all indicators offered by [the Tulip Indicators library](https://tulipindicators.org/). Gekko will pass the correct market data to Tulip and you only have to provide the `optIn` configurable parameters.

## Install

### Bash on Windows, OSX or Linux

Open your terminal. Then:

```
cd ~/gekko
npm install tulind --no-save
```

## Example

If you want to use the MACD indicator from Tulip, you need to register it in your strategy like so:

    method.init = function() {
      var customMACDSettings = {
        optInFastPeriod: 10,
        optInSlowPeriod: 21,
        optInSignalPeriod: 9
      }

      // add the indicator to the strategy
      this.addTulipIndicator('mymacd', 'macd', customMACDSettings);
    }

    method.check = function() {
      // use indicator results
      var result = this.tulipIndicators.mymacd.result;
      var macddiff = result['macd'] - result['macdSignal'];

      // do something with macdiff
    }

## Tulip Indicators

Here is a list of all supported indicators, click on them to see the required parameters.

- [AD](#ad)
- [ADOSC](#adosc)
- [ADX](#adx)
- [ADXR](#adxr)
- [AO](#ao)
- [APO](#apo)
- [AROON](#aroon)
- [AROONOSC](#aroonosc)
- [ATR](#atr)
- [AVGPRICE](#avgprice)
- [BBANDS](#bbands)
- [BOP](#bop)
- [CCI](#cci)
- [CMO](#cmo)
- [CVI](#cvi)
- [DEMA](#dema)
- [DI](#di)
- [DM](#dm)
- [DPO](#dpo)
- [DX](#dx)
- [EMA](#ema)
- [EMV](#emv)
- [FISHER](#fisher)
- [FOSC](#fosc)
- [HMA](#hma)
- [KAMA](#kama)
- [KVO](#kvo)
- [LINREG](#linreg)
- [LINREGINTERCEPT](#linregintercept)
- [LINREGSLOPE](#linregslope)
- [MARKETFI](#marketfi)
- [MASS](#mass)
- [MEDPRICE](#medprice)
- [MFI](#mfi)
- [MSW](#msw)
- [NATR](#natr)
- [NVI](#nvi)
- [OBV](#obv)
- [PPO](#ppo)
- [PSAR](#psar)
- [PVI](#pvi)
- [QSTICK](#qstick)
- [ROC](#roc)
- [ROCR](#rocr)
- [RSI](#rsi)
- [SMA](#sma)
- [STOCH](#stoch)
- [SUM](#sum)
- [TEMA](#tema)
- [TR](#tr)
- [TRIMA](#trima)
- [TRIX](#trix)
- [TSF](#tsf)
- [TYPPRICE](#typprice)
- [ULTOSC](#ultosc)
- [VHF](#vhf)
- [VIDYA](#vidya)
- [VOLATILITY](#volatility)
- [VOSC](#vosc)
- [VWMA](#vwma)
- [WAD](#wad)
- [WCPRICE](#wcprice)
- [WILDERS](#wilders)
- [WILLR](#willr)
- [WMA](#wma)
- [ZLEMA](#zlema)

## API

### ad

This indicator does not require any parameters.

### adosc

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod

### adx

More information on the [**Average Directonal Movement Index**](https://en.wikipedia.org/wiki/Average_directional_movement_index)

Required parameters:

 - optInTimePeriod

### adxr

The **Average Directional Movement Index Rating** is used as a risk indicator for a security in an [adx](#adx) system. It evaluates the risk (volatility) of a security by smoothing the amplitude readings of the trend function of the adx. It is calculated as follows

    ADX plus the ADX (n-time periods ago) divided by 2

Higher readings conform to lower risk and lower readings conform to higher risk.
A investor wanting to lower the portfolio risk will therefore use securities with higher adxr ratings.

Required parameters:

 - optInTimePeriod

### ao

More information about the [**Awesome Oscillator**](https://www.tradingview.com/wiki/Awesome_Oscillator_(AO))

This indicator does not require any parameters.

### apo

The **Absolute Price Oscillator** displays the difference between two exponential moving averages of a security's price and is expressed as an absolute value. It rates the trends strength in relation to the moving between the two moving averages with short-term momentum being the catalyst.

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod

### aroon

More information about the [Aroon](https://www.tradingview.com/wiki/Aroon) Indicator.

Required parameters:

 - optInTimePeriod

### aroonosc

The Aroon Oscillator belongs to the group of trend-following indicators and uses parts of the Aroon Indicator (namely "Aroon Up" and "Aroon Down") to indicate the strength of a current trend and the likelihood that it will continue. The Aroon Oscillator is calculated by subtracting Aroon Up from Aroon Down. Readings above zero indicate that an uptrend is present, while readings below zero indicate that a downtrend is present.

Required parameters:

 - optInTimePeriod

### atr

More information about the [Average True Range](https://www.tradingview.com/wiki/Average_True_Range_(ATR))

Required parameters:

 - optInTimePeriod

### avgprice

The average price indicator calculates the mean of the open, high, low, and close of a bar

    open + high + low + close / 4

This indicator does not require any parameters.

### bbands

More information about [Bollinger Bands](https://www.tradingview.com/wiki/Bollinger_Bands_(BB))

Required parameters:

 - optInTimePeriod
 - optInNbStdDevs

### bop

The Balance of Power indicator measures the market strength of buyers against sellers by assessing the ability of each side to drive prices to an extreme level. The calculation is: 

    Balance of Power = (Close price – Open price) / (High price – Low price) 
    
The resulting value can be smoothed by a moving average.

This indicator does not require any parameters.

### cci

More information about the [Commodity Channel Index](https://www.tradingview.com/wiki/Commodity_Channel_Index_(CCI))

Required parameters:

 - optInTimePeriod

### cmo

The Chande Momentum Oscillator is a technical momentum indicator. The indicator is created by calculating the difference between the sum of all recent higher closes and the sum of all recent lower closes and then dividing the result by the sum of all price movement over a given time period. The result is multiplied by 100 to give the -100 to +100 range. The defined time period is usually 20 periods.

    CMO = 100 * ((Sh - Sd)/ ( Sh + Sd ) )

Where:

Sh = Sum of the difference between the current close and previous close on up days for the specified period. Up days are days when the current close is greater than the previous close.
 
Sd = Sum of the absolute value of the difference between the current close and the previous close on down days for the specified period. Down days are days when the current close is less than the previous close.

Required parameters:

 - optInTimePeriod

### cvi

More information about the [Chaikin Volatility Index](https://www.tradingview.com/wiki/Chaikin_Oscillator) also called the Chaikin Oscillator.

Required parameters:

 - optInTimePeriod

### dema

More information about the [DEMA](https://en.wikipedia.org/wiki/Double_exponential_moving_average)

Required parameters:

 - optInTimePeriod

### di

More information about the [Directional Indicator](https://en.wikipedia.org/wiki/Average_directional_movement_index)

Required parameters:

 - optInTimePeriod

### dm

More information about the [Directional Movement Index](https://en.wikipedia.org/wiki/Average_directional_movement_index)

Required parameters:

 - optInTimePeriod

### dpo

More information about the [Detrended Price Oscillator](https://en.wikipedia.org/wiki/Detrended_price_oscillator)

Required parameters:

 - optInTimePeriod

### dx

More information about the [Directional Movement Index](https://en.wikipedia.org/wiki/Average_directional_movement_index)

Required parameters:

 - optInTimePeriod

### ema

Exponential Moving Average (EMA) is similar to Simple Moving Average (SMA), measuring trend direction over a period of time. However, whereas SMA simply calculates an average of price data, EMA applies more weight to data that is more current. Because of its unique calculation, EMA will follow prices more closely than a corresponding SMA.

    EMA = (K x (C - P)) + P

Where:

 - C = Current Price 
 - P = Previous periods EMA (A SMA is used for the first periods calculations) 
 - K = Exponential smoothing constant

Required parameters:

 - optInTimePeriod

### emv

More information about the [Ease of Movement](https://www.tradingview.com/wiki/Ease_of_Movement_(EOM))

This indicator does not require any parameters.

### fisher

The Fisher Transform is a technical indicator that converts prices into a Gaussian normal distribution. The indicator enables traders to create a nearly Gaussian probability density function by normalizing prices. That is, the transformation makes peak swings relatively rare events and unambiguously identifies price reversals on a chart. 

    Y = 0.5 * ln ((1+X)/(1-X))
 
Where:

 - "ln" denotes the abbreviated form of the natural logarithm
 - "X" denotes the transformation of price to a level between -1 and 1 for ease of calculation

Required parameters:

 - optInTimePeriod

### fosc

The forecast oscillator attempts to predict price action by comparing the results of a linear regression trendline to the actual price for that day. Positive values of the oscillator occur when the forecast price is above the actual price and negative values when the forecast price is below. If prices are consistently below the forecast, then a downturn in prices is likely. Conversely, if prices are consistently above the forecast then an upturn in prices is likely.

Required parameters:

 - optInTimePeriod

### hma

Basic forms of moving averages like the Simple Moving Average lag price. The Exponential and Weighted Moving Averages were developed to address this lag by placing more emphasis on more recent data. The Hull Moving Average in contrast is an extremely fast and smooth moving average, it almost eliminates lag altogether and manages to improve smoothing at the same time.

    HMA= WMA(2*WMA(n/2) − WMA(n)),sqrt(n))

Required parameters:

 - optInTimePeriod

### kama

The Kaufman adaptive moving average belongs to the group of "intelligent" indicators. It´s concept addresses the fact that noisy markets should have a lagging indicator and trending markets should have a leading indicator. So it adapts itself to lag in sideways markets and lead in trending markets.

    KAMA(t) = KAMA(t-1) + sc(t) x (Price-KAMA(t-1))

Where:

 - KAMA(t) is the new adaptive moving average value
 - KAMA(t-1) is the previous adaptive moving average value
 - Price is the current price
 - sc(t) is the smoothing constant

Required parameters:

 - optInTimePeriod

### kvo

The Klinger Volume Oscillator measures trends of money flows based upon volume. The KO is derived from three types of data: the high-low price range, volume, and accumulation/distribution. Price range is a measure of movement and the force behind that movement is volume. Accumulation is when the sum of today's [high]+[low]+[close] is greater than yesterday's. Distribution is when today's sum is less than the yesterday's. When the sums are equal, the existing trend is maintained.

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod

### linreg

The Linear Regression is a smoothing functions that works by preforming linear least squares regression over a moving window. It then uses the linear model to predict the value for the current bar.

Required parameters:

 - optInTimePeriod

### linregintercept

More information about the [Linear Regression Intercept](https://en.wikipedia.org/wiki/Simple_linear_regression)

Required parameters:

 - optInTimePeriod

### linregslope

More information about the [Linear Regression Intercept](https://en.wikipedia.org/wiki/Simple_linear_regression)

Required parameters:

 - optInTimePeriod

### macd

More information about the [MACD](https://www.tradingview.com/wiki/MACD_(Moving_Average_Convergence/Divergence))

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod
 - optInSignalPeriod

### marketfi

The Market Facilitation Index indicator combines price and volume in the analysis to establish the effectiveness of price movement by computing the price movement per volume unit. To calculate the Market Facilitation Index indicator the difference between the low and the high price are taken and divided by the volume.

This indicator does not require any parameters.

### mass

The Mass Index indicator is used for finding trend reversals, based on the premise that reversals are likely to happen when the price range widens. It does not have a directional bias. The calculation, which compares the previous trading ranges (highs minus lows), uses Exponential Moving Averages (EMA). If there is substantial movement, the Mass Index Indicator increases if there is insubstantial movement the Mass Index Indicator decreases. 

Formula (usually a 9 period EMA is used)

    Single EMA = (x)-period exponential moving average (EMA) of the high-low differential  
    Double EMA = (y)-period EMA of the (x)-period EMA of the high-low differential 
    EMA Ratio = Single EMA divided by Double EMA 
    Mass Index = 25-period sum of the EMA Ratio 

Required parameters:

 - optInTimePeriod

### medprice

The median price indicator calculates the mean of the high and low for a bar. Despite the name, it does not calculate an actual median value.

    medprice(t) = (high(t) + low(t)) / 2

This indicator does not require any parameters.

### mfi

More information about the [MFI](https://www.tradingview.com/wiki/Money_Flow_(MFI))

Required parameters:

 - optInTimePeriod

### msw

The Maximum Entropy Spectrum Analysis indicator is a unique way to accurately measure short-term cycles in a market. It utilizes two sine plots to illustrate if the market is in a cycle mode or in a trend mode. When the two plots resemble a sine wave the market is in cycling mode. When the plots start to wander the market is in a trend mode. 
The MESA Sine Wave indicator is a leading indicator that will anticipate cycle mode turning points rather than waiting for confirmation as is seen with most other oscillators. The indicator has the additional advantage that trend mode whipsaw signals are minimized.

Required parameters:

 - optIn

### natr

The Normalized Average True Range is a measure of volatility.
It is calculated as follows:

    natr = (atr(t) / close(t)) * 100

Required parameters:

 - optInTimePeriod

### nvi

More information about the [NVI](https://en.wikipedia.org/wiki/Negative_volume_index)

This indicator does not require any parameters.

### obv

More information about the [OBV](https://www.tradingview.com/wiki/On_Balance_Volume_(OBV))

This indicator does not require any parameters.

### ppo

More information about the [PPO](https://www.tradingview.com/wiki/Price_Oscillator_(PPO))

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod

### psar

More information about the [Parabolic SAR](https://www.tradingview.com/wiki/Parabolic_SAR_(SAR))

Required parameters:

 - optInAcceleration
 - optInMaximum

### pvi

More information about the [PVI](https://en.wikipedia.org/wiki/Negative_volume_index)

This indicator does not require any parameters.

### qstick

The Qstick Indicator identifies trends on a chart. It is calculated by taking an 'n' period moving average of the difference between the open and closing prices. A Qstick value greater than zero means that the majority of the last 'n' days have been up, indicating that buying pressure has been increasing. In summary, the measure provides an approximation for a security’s  EMA, opening price, closing price, and their difference, as well as these values SMA.

Required parameters:

 - optInTimePeriod

### roc

More information about the [Rate of Change](https://www.tradingview.com/wiki/Rate_of_Change_(ROC))

Required parameters:

 - optInTimePeriod

### rocr

Rate Of Change Ratio calculates the change between the current price and the price n bars ago.

Required parameters:

 - optInTimePeriod

### rsi

More information about the [RSI](https://www.tradingview.com/wiki/Relative_Strength_Index_(RSI))

Required parameters:

 - optInTimePeriod

### sma

More information about the [SMA](https://www.tradingview.com/wiki/Moving_Average)

Required parameters:

 - optInTimePeriod

### stoch

More information about the [STOCH](https://www.tradingview.com/wiki/Stochastic_(STOCH))

Required parameters:

 - optInFastKPeriod
 - optInSlowKPeriod
 - optInSlowDPeriod

### sum

The Sum Over Period indicator simply returns the sum of the last n bars.

Required parameters:

 - optInTimePeriod

### tema

The Triple Exponential Moving Average is similar to the Exponential Moving Average or the Double Exponential Moving Average, but provides even less lag. Triple Exponential Moving Average is probably best viewed as an extension of Double Exponential Moving Average.

It can be expressed in terms of the Exponential Moving Average as follows:

    tema = 3 * ema(in) - 3 * ema(ema(in)) + ema(ema(ema(in)))

Required parameters:

 - optInTimePeriod

### tr

True range is a measure of volatility. It represents how much a security changed price on a given day.

True range for each day is the greatest of:

 - Day's high minus day's low
 - The absolute value of the day's high minus the previous day's close
 - The absolute value of the day's low minus the previous day's close

This indicator does not require any parameters.

### trima

The Triangular Moving Average is similar to the Simple Moving Average but instead places more weight on middle portion of the smoothing period and less weight on the newest and oldest bars in the period.
It is calculated for each bar as the weighted arithmetic mean of the previous n bars. For example, the weights w for an n of 4 are: 1, 2, 2, 1. The weights w for a n of 7 are: 1, 2, 3, 4, 3, 2, 1. It's easy to see why it's called the Triangular Moving Average.

Required parameters:

 - optInTimePeriod

### trix

More information about the [TRIX](https://www.tradingview.com/wiki/TRIX)

Required parameters:

 - optInTimePeriod

### tsf

The Time Series Forecast indicator displays the statistical trend of a security's price over a specified time period. The trend is based on linear regression analysis. Rather than plotting a straight linear regression trendline, the Time Series Forecast plots the last point of multiple linear regression trendlines. The resulting TSF indicator is sometimes referred to as the "moving linear regression" indicator or the "regression oscillator."

Required parameters:

 - optInTimePeriod

### typprice

The Typical Price calculates the arithmetic mean of the high, low, and close of a bar.

This indicator does not require any parameters.

### ultosc

More information about the [UO](https://www.tradingview.com/wiki/Ultimate_Oscillator_(UO))

Required parameters:

 - optInTimePeriod1
 - optInTimePeriod2
 - optInTimePeriod3

### vhf

The Vertical Horizontal Filter determines whether prices are in a trending phase or a congestion phase. It is used to dertermine which other indicators are to be used in the current market trend. For example if the VHF suggests the market is in a range then a [mesa] could be used if the VHF suggests the market is in a range then one could use a [psar] to determine entry and exit points.

Required parameters:

 - optInTimePeriod

### vidya

The Variable Index Dynamic Average indicator modifies the Exponential Moving Average by varying the smoothness based on recent volatility.

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod
 - optInAlpha

### volatility

The Annualized Historical Volatility indicator calculates the volatility over a moving window.

Required parameters:

 - optInTimePeriod

### vosc

The Volume Oscillator identifies trends in volume using two moving averages of volume, one fast and one slow. The fast volume moving average is then subtracted from the slow moving average. 

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod

### vwma

The Volume Weighted Moving Average is simalair to a Simple Moving Average, but it weights each bar by its volume.

Required parameters:

 - optInTimePeriod

### wad

Williams AD is a running sum of positive accumulation values (buying pressure) and negative distribution values (selling pressure), as determined by price's location within a given day's true range. The day's accumulation/distribution is then calculated by comparing today's closing price to yesterday's closing price.
To calculate the Williams' Accumulation/Distribution indicator, determine:

    True Range High (TRH) = Yesterday's close or today's high whichever is greater
    True Range Low (TRL) = Yesterday's close or today's low whichever is less
    
The Williams' Accumulation/Distribution indicator is a cumulative total of the daily values:

 - Williams A/D = Today's A/D + Yesterday's Williams A/D

This indicator does not require any parameters.

### wcprice

The weighted close price indicator calculates the mean of the high, low, and close of a bar, but the close price is weighted to count for double.

This indicator does not require any parameters.

### wilders

The Welles Wilder Smoothing indicator is basically the same as an [EMA](#ema) and can be used in the same manner. 
It uses a different calculation but can be easily calculated by simply converting EMA values as follows:

    wilders = (ema + 1) / 2

Required parameters:

 - optInTimePeriod

### willr

More information about the [Williams R](https://www.tradingview.com/wiki/Williams_%25R_(%25R))

Required parameters:

 - optInTimePeriod

### wma

More information about the [WMA](https://en.wikipedia.org/wiki/Moving_average#Simple_moving_average)

Required parameters:

 - optInTimePeriod

### zlema

Zero-Lag Exponential Moving Average modifies a Exponential Moving Average to greatly reduce lag.

Required parameters:

 - optInTimePeriod
