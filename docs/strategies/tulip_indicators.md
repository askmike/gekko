# Tulip indicators

When writing [your own strategy](./creating_a_trading_method.md) you can use all indicators offered by [the Tulip Indicators library](https://tulipindicators.org/). Gekko will pass the correct market data to Tulip and you only have to provide the `optIn` configurable parameters.

## Install

### Bash on Windows, OSX or Linux

Open your terminal. Then:

```
cd ~/gekko
npm install tulind
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

Required parameters:

 - optInTimePeriod

### adxr

Required parameters:

 - optInTimePeriod

### ao

This indicator does not require any parameters.

### apo

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod

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

This indicator does not require any parameters.

### bbands

Required parameters:

 - optInTimePeriod
 - optInNbStdDevs

### bop

This indicator does not require any parameters.

### cci

Required parameters:

 - optInTimePeriod

### cmo

Required parameters:

 - optInTimePeriod

### cvi

Required parameters:

 - optInTimePeriod

### dema

Required parameters:

 - optInTimePeriod

### di

Required parameters:

 - optInTimePeriod

### dm

Required parameters:

 - optInTimePeriod

### dpo

Required parameters:

 - optInTimePeriod

### dx

Required parameters:

 - optInTimePeriod

### ema

Required parameters:

 - optInTimePeriod

### emv

This indicator does not require any parameters.

### fisher

Required parameters:

 - optInTimePeriod

### fosc

Required parameters:

 - optInTimePeriod

### hma

Required parameters:

 - optInTimePeriod

### kama

Required parameters:

 - optInTimePeriod

### kvo

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod

### linreg

Required parameters:

 - optInTimePeriod

### linregintercept

Required parameters:

 - optInTimePeriod

### linregslope

Required parameters:

 - optInTimePeriod

### macd

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod
 - optInSignalPeriod

### marketfi

This indicator does not require any parameters.

### mass

Required parameters:

 - optInTimePeriod

### medprice

This indicator does not require any parameters.

### mfi

Required parameters:

 - optInTimePeriod

### msw

Required parameters:

 - optIn

### natr

Required parameters:

 - optInTimePeriod

### nvi

This indicator does not require any parameters.

### obv

This indicator does not require any parameters.

### ppo

Required parameters:

 - optInFastPeriod
 - optInSlowPeriod

### psar

Required parameters:

 - optInAcceleration
 - optInMaximum

### pvi

This indicator does not require any parameters.

### qstick

Required parameters:

 - optInTimePeriod

### roc

Required parameters:

 - optInTimePeriod

### rocr

Required parameters:

 - optInTimePeriod

### rsi

Required parameters:

 - optInTimePeriod

### sma

Required parameters:

 - optInTimePeriod

### stoch

Required parameters:

 - optInFastKPeriod
 - optInSlowKPeriod
 - optInSlowDPeriod

### sum

Required parameters:

 - optInTimePeriod

### tema

Required parameters:

 - optInTimePeriod

### tr

This indicator does not require any parameters.

### trima

Required parameters:

 - optInTimePeriod

### trix

Required parameters:

 - optInTimePeriod

### tsf

Required parameters:

 - optInTimePeriod

### tsf

Required parameters

 - optInTimePeriod

### typprice

This indicator does not require any parameters.

### ultosc

Required parameters:

 - optInTimePeriod1
 - optInTimePeriod2
 - optInTimePeriod3

### vhf

Required parameters

 - optInTimePeriod

### vidya

Required parameters

 - optInFastPeriod
 - optInSlowPeriod
 - optInAlpha

### volatility

Required parameters:

 - optInTimePeriod

### vosc

Required parameters

 - optInFastPeriod
 - optInSlowPeriod

### vwma

Required parameters:

 - optInTimePeriod

### wad

This indicator does not require any parameters.

### wcprice

This indicator does not require any parameters.

### wilders

Required parameters:

 - optInTimePeriod
 - 
### willr

Required parameters:

 - optInTimePeriod

### wma

Required parameters:

 - optInTimePeriod

### zlema

Required parameters:

 - optInTimePeriod