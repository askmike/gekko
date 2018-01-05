# TA-lib indicators

When writing [your own strategy](./creating_a_strategy.md) you can use all indicators offered by [the TA-lib library](http://ta-lib.org/function.html). Gekko will pass the correct market data to TA-lib and you only have to provide the `optIn` configurable parameters.

## Install

### Bash on Windows, OSX or Linux

Open your terminal. Then:

```
cd ~/gekko
npm install talib
```

## Example

If you want to use the MACD indicator from TA-lib, you need to register it in your strategy like so:

    method.init = function() {
      var customMACDSettings = {
        optInFastPeriod: 10,
        optInSlowPeriod: 21,
        optInSignalPeriod: 9
      }

      // add the indicator to the strategy
      this.addTalibIndicator('mymacd', 'macd', customMACDSettings);
    }

    method.check = function() {
      // use indicator results
      var result = this.talibIndicators.mymacd.result;
      var macddiff = result['outMACD'] - result['outMACDSignal'];

      // do something with macdiff
    }

## TA-lib Indicators

Here is a list of all supported indicators, click on them to see the required parameters.

- [ACCBANDS](#accbands)
- [AD](#ad)
- [ADOSC](#adosc)
- [ADX](#adx)
- [ADXR](#adxr)
- [APO](#apo)
- [AROON](#aroon)
- [AROONOSC](#aroonosc)
- [ATR](#atr)
- [AVGPRICE](#avgprice)
- [BBANDS](#bbands)
- [BOP](#bop)
- [CCI](#cci)
- [CMO](#cmo)
- [DEMA](#dema)
- [DX](#dx)
- [EMA](#ema)
- [HT_DCPERIOD](#ht_dcperiod)
- [HT_DCPHASE](#ht_dcphase)
- [HT_PHASOR](#ht_phasor)
- [HT_SINE](#ht_sine)
- [HT_TRENDLINE](#ht_trendline)
- [HT_TRENDMODE](#ht_trendmode)
- [IMI](#imi)
- [KAMA](#kama)
- [LINEARREG](#linearreg)
- [LINEARREG_ANGLE](#linearreg_angle)
- [LINEARREG_INTERCEPT](#linearreg_intercept)
- [LINEARREG_SLOPE](#linearreg_slope)
- [MA](#ma)
- [MACD](#macd)
- [MACDEXT](#macdext)
- [MACDFIX](#macdfix)
- [MAMA](#mama)
- [MAVP](#mavp)
- [MAX](#max)
- [MAXINDEX](#maxindex)
- [MEDPRICE](#medprice)
- [MFI](#mfi)
- [MIDPOINT](#midpoint)
- [MIDPRICE](#midprice)
- [MIN](#min)
- [MININDEX](#minindex)
- [MINMAX](#minmax)
- [MINMAXINDEX](#minmaxindex)
- [MINUS_DI](#minus_di)
- [MINUS_DM](#minus_dm)
- [MOM](#mom)
- [NATR](#natr)
- [OBV](#obv)
- [PLUS_DI](#plus_di)
- [PLUS_DM](#plus_dm)
- [PPO](#ppo)
- [ROC](#roc)
- [ROCP](#rocp)
- [ROCR](#rocr)
- [ROCR100](#rocr100)
- [RSI](#rsi)
- [SAR](#sar)
- [SAREXT](#sarext)
- [SMA](#sma)
- [STDDEV](#stddev)
- [STOCH](#stoch)
- [STOCHF](#stochf)
- [STOCHRSI](#stochrsi)
- [T3](#t3)
- [TEMA](#tema)
- [TRANGE](#trange)
- [TRIMA](#trima)
- [TRIX](#trix)
- [TSF](#tsf)
- [TYPPRICE](#typprice)
- [ULTOSC](#ultosc)
- [VARIANCE](#variance)
- [WCLPRICE](#wclprice)
- [WILLR](#willr)
- [WMA](#wma)

## API

### accbands

Required parameters:

 - optInTimePeriod

### ad

Required parameters:

 - optInTimePeriod

### adosc

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod

### adx

Required parameters:

 - optInTimePeriod

### adxr

Required parameters:

 - optInTimePeriod

### apo

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod
 - optInMAType

### aroon

Required parameters:

 - optInTimePeriod

### aroonosc

Required parameters:

 - optInTimePeriod

### atr

Required parameters:

 - optInTimePeriod

### avgprice

Required parameters:

 - optInTimePeriod

### bbands

Required parameters:

 - optInTimePeriod
 - optInNbDevUp
 - optInNbDevDn
 - optInMAType

### bop

This indicator does not require any parameters.

### cci

Required parameters:

 - optInTimePeriod

### cmo

Required parameters:

 - optInTimePeriod

### dema

Required parameters:

 - optInTimePeriod

### dx

Required parameters:

 - optInTimePeriod

### ema

Required parameters:

 - optInTimePeriod

### ht_dcperiod

This indicator does not require any parameters.

### ht_dcphase

This indicator does not require any parameters.

### ht_phasor

This indicator does not require any parameters.

### ht_sine

This indicator does not require any parameters.

### ht_trendline

This indicator does not require any parameters.

### ht_trendmode

This indicator does not require any parameters.

### imi

Required parameters:

 - optInTimePeriod

### kama

Required parameters:

 - optInTimePeriod

### linearreg

Required parameters:

 - optInTimePeriod

### linearreg_angle

Required parameters:

 - optInTimePeriod

### linearreg_intercept

Required parameters:

 - optInTimePeriod

### linearreg_slope

Required parameters:

 - optInTimePeriod

### ma

Required parameters:

 - optInTimePeriod
 - optInMAType

### macd

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod
 - optInSignalPeriod

### macdext

Required parameters:

 - optInFastPeriod
 - optInFastMAType
 - optInSlowPeriod
 - optInSlowMAType
 - optInSignalPeriod
 - optInSignalMAType

### macdfix

Required parameters:

 - SignalPeriod

### mama

Required parameters:

 - optInFastLimit
 - optInSlowLimit

### mavp

Required parameters:

 - inPeriods
 - optInMinPeriod
 - optInMaxPeriod
 - optInMAType

### max

Required parameters:

 - optInTimePeriod

### maxindex

Required parameters:

 - optInTimePeriod

### medprice

Required parameters:

 - optInTimePeriod

### mfi

Required parameters:

 - optInTimePeriod

### midpoint

Required parameters:

 - optInTimePeriod

### midprice

Required parameters:

 - optInTimePeriod

### min

Required parameters:

 - optInTimePeriod

### minindex

Required parameters:

 - optInTimePeriod

### minmax

Required parameters:

 - optInTimePeriod

### minmaxindex

Required parameters:

 - optInTimePeriod

### minus_di

Required parameters:

 - optInTimePeriod

### minus_dm

Required parameters:

 - optInTimePeriod

### mom

Required parameters:

 - optInTimePeriod

### natr

Required parameters:

 - optInTimePeriod

### obv

This indicator does not require any parameters.

### plus_di

Required parameters:

 - optInTimePeriod

### plus_dm

Required parameters:

 - optInTimePeriod

### ppo

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod
 - optInMAType

### roc

Required parameters:

 - optInTimePeriod

### rocp

Required parameters:

 - optInTimePeriod

### rocr

Required parameters:

 - optInTimePeriod

### rocr100

Required parameters:

 - optInTimePeriod

### rsi

Required parameters:

 - optInTimePeriod

### sar

Required parameters:

 - optInAcceleration
 - optInMaximum

### sarext

Required parameters:

 - optInStartValue
 - optInOffsetOnReverse
 - optInAccelerationInitLong
 - optInAccelerationLong
 - optInAccelerationMaxLong
 - optInAccelerationInitShort
 - optInAccelerationShort
 - optInAccelerationMaxShort

### sma

Required parameters:

 - optInTimePeriod

### stddev

Required parameters:

 - optInTimePeriod
 - optInNbDev

### stoch

Required parameters:

 - optInFastK_Period
 - optInSlowK_Period
 - optInSlowK_MAType
 - optInSlowD_Period
 - optInSlowD_MAType

### stochf

Required parameters:

 - optInFastK_Period
 - optInFastD_Period
 - optInFastD_MAType

### stochrsi

Required parameters:

 - optInTimePeriod
 - optInFastK_Period
 - optInFastD_Period
 - optInFastD_MAType

### t3

Required parameters:

 - optInTimePeriod
 - optInFastK_Period
 - optInFastD_Period
 - optInFastD_MAType

### tema

Required parameters:

 - optInTimePeriod

### trange

Required parameters:

 - optInTimePeriod

### trima

Required parameters:

 - optInTimePeriod

### trix

Required parameters:

 - optInTimePeriod

### tsf

Required parameters:

 - optInTimePeriod

### typprice

Required parameters:

 - optInTimePeriod

### ultosc

Required parameters:

 - optInTimePeriod

### variance

Required parameters:

 - optInTimePeriod
 - optInNbDev

### wclprice

Required parameters:

 - optInTimePeriod

### willr

Required parameters:

 - optInTimePeriod

### wma

Required parameters:

 - optInTimePeriod
