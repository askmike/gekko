# Importing

*Note: this documentation was written for running Gekko via the command line. If you are using the UI you can simply use the importer under the "local data" tab.*

If you want to use Gekko to [backtest against historical data](./backtesting.md), you most likely need some historical data to test against. Gekko comes with the functionality to automatically import historical data from some exchanges. However, only a few exchanges support this. You can find out with which exchanges Gekko is able to do this [here](https://github.com/askmike/gekko#supported-exchanges).

## Setup

For importing you should [enable and configure](./plugins.md) the following plugin:

 - candleWriter (to store the imported data in a database)

Besides that, make sure to configure `config.watch` properly.

## Configure

In your config set the `importer.daterange` properties to the daterange you would like to import.

## Run

    node gekko --import

The result will be something like this:

    2016-06-26 09:12:16 (INFO): Gekko v0.2.2 started
    2016-06-26 09:12:16 (INFO): I'm gonna make you rich, Bud Fox. 

    2016-06-26 09:12:17 (INFO): Setting up Gekko in importer mode
    2016-06-26 09:12:17 (INFO): 
    2016-06-26 09:12:17 (INFO): Setting up:
    2016-06-26 09:12:17 (INFO):      Candle writer
    2016-06-26 09:12:17 (INFO):      Store candles in a database
    2016-06-26 09:12:17 (INFO): 

    2016-06-26 09:12:17 (WARN): The plugin Trading Advisor does not support the mode importer. It has been disabled.
    2016-06-26 09:12:17 (WARN): The plugin Advice logger does not support the mode importer. It has been disabled.
    2016-06-26 09:12:17 (WARN): The plugin Profit Simulator does not support the mode importer. It has been disabled.
    2016-06-26 09:12:18 (DEBUG):    Processing 798 new trades.
    2016-06-26 09:12:18 (DEBUG):    From 2015-09-09 12:00:04 UTC to 2015-09-09 13:58:55 UTC. (2 hours)
    2016-06-26 09:12:20 (DEBUG):    Processing 211 new trades.
    (...)
