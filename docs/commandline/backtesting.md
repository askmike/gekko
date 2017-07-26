# Backtesting with Gekko

*Note: this documentation was written for running Gekko via the command line. If you are using the UI you can simply use the importer under the "local data" tab.*

Gekko is able to backtest strategies against historical data.

## Setup

For backtesting you should [enable and configure](./Plugins.md) the following plugins:

 - trading advisor (to run your strategy).
 - paper trader (to execute simulated trades).
 - performance analyzer (to calculate how succesfull the strategy would have been).

Besides that, make sure to configure `config.watch`.

## Historical data

Gekko requires historical data to backtest strategies against. The easiest way to get this is to let Gekko import historical data, however this is not supported by a lot of exchanges (see [here](https://github.com/askmike/gekko#supported-exchanges)). The second easiest and most universal way is to run Gekko on real markets using the UI (or alternatively via the commandline with the plugin sqliteWriter enabled). Though this takes a while, as you need to run Gekko for a week to have a week of data.

## Configure

In your config set the `backtest.daterange` to `scan`. This will force Gekko to scan the local database to figure out what dataranges are available. If you already know exactly what daterange you would like to backtest against, you can set the `backtest.daterange` directly (set `backtest.daterange` as an object with the keys `from` and `to` and the values as a data parsable by [moment](http://momentjs.com/docs/#/parsing/)).

## Run

    node gekko --backtest

The result will be something like this:

    2016-06-11 08:53:20 (INFO): Gekko v0.2.1 started
    2016-06-11 08:53:20 (INFO): I'm gonna make you rich, Bud Fox.

    2016-06-11 08:53:20 (INFO): Setting up Gekko in backtest mode
    2016-06-11 08:53:20 (INFO):
    2016-06-11 08:53:20 (WARN): The plugin SQLite Datastore does not support the mode backtest. It has been disabled.
    2016-06-11 08:53:20 (INFO): Setting up:
    2016-06-11 08:53:20 (INFO):    Trading Advisor
    2016-06-11 08:53:20 (INFO):    Calculate trading advice
    2016-06-11 08:53:20 (INFO):    Using the trading method: DEMA
    2016-06-11 08:53:20 (INFO):

    2016-06-11 08:53:20 (INFO): Setting up:
    2016-06-11 08:53:20 (INFO):    Profit Simulator
    2016-06-11 08:53:20 (INFO):    Paper trader that logs fake profits.
    2016-06-11 08:53:20 (INFO):

    2016-06-11 08:58:20 (INFO): Profit simulator got advice to long @ 2016-05-30 04:37:00, buying 1.1880062 BTC
    2016-06-11 08:58:21 (INFO): Profit simulator got advice to short  @ 2016-05-31 21:37:00, selling 1.1880062 BTC
    2016-06-11 08:58:21 (INFO): Profit simulator got advice to long @ 2016-06-01 12:37:00, buying 1.14506098 BTC
    2016-06-11 08:58:21 (INFO): Profit simulator got advice to short  @ 2016-06-02 14:57:00, selling 1.14506098 BTC
    2016-06-11 08:58:21 (INFO): Profit simulator got advice to long @ 2016-06-02 23:37:00, buying 1.11711818 BTC
    2016-06-11 08:58:21 (INFO): Profit simulator got advice to short  @ 2016-06-05 12:57:00, selling 1.11711818 BTC
    2016-06-11 08:58:21 (INFO): Profit simulator got advice to long @ 2016-06-06 02:37:00, buying 1.08456953 BTC
    2016-06-11 08:58:22 (INFO): Profit simulator got advice to short  @ 2016-06-07 17:17:00, selling 1.08456953 BTC
    2016-06-11 08:58:22 (INFO): Profit simulator got advice to long @ 2016-06-08 13:17:00, buying 1.05481755 BTC
    2016-06-11 08:58:22 (INFO): Profit simulator got advice to short  @ 2016-06-09 14:17:00, selling 1.05481755 BTC

    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) start time:      2016-05-29 23:34:00
    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) end time:      2016-06-10 08:56:00
    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) timespan:      11 days days

    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) start price:       516.19
    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) end price:       578.97
    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) Buy and Hold profit:     12.162189999999995%

    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) amount of trades:    10
    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) original simulated balance:  616.19000 USD
    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) current simulated balance:   602.59867 USD
    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) simulated profit:    -13.59133 USD (-2.20570%)
    2016-06-11 08:53:22 (INFO): (PROFIT REPORT) simulated yearly profit:   -435.53244 USD (-70.68152%)