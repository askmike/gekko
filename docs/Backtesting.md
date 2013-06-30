# Backtesting with Gekko

**Note that this functionality should only be used for testing purposes at this moment as it's in early development stage**

## Preparing Gekko

You can configure Gekko to test the current EMA strategy on historical data. To do this you need candle data in CSV format. On [this webpage](https://bitcointalk.org/index.php?topic=239815.0) you can downloaded precalculated candles from Mt. Gox or you can calculate your own using the script provided in the link. Alternatively you can supply your own candles, the only requirement is that the csv file has candles ordered like this: `timestamp,open,high,low,close`.

## Configuring Gekko

Once you have the csv file with candles you can configure Gekko for backtesting: in [config.js](https://github.com/askmike/gekko/blob/master/config.js) in the advanced zone you need to the backtesting part like so:

    config.backtest = {
      enabled: true, // set to true to run backtests instead of live monitoring
      candleFile: 'candles.csv', // the candles file
      from: 0, // optional start timestamp 
      to: 0 // optional end timestamp
    }

Once configured Gekko will run the backtest instead of watching the live market. It wil use the following configuration items:

* Everything under `backtest`.
* Everything under `profitCalculator`.
* Everything under `EMA` with the exception of interval, as this will be determined by the candles file.

## Notes

* Use the backtesting feature only for testing until the code is stable.
* When there are missing candles Gekko will act as if the whole duration of the missing candle never happened.