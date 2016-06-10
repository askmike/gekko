# Backtesting with Gekko

Gekko is able to backtest strategies against historical data.

## Setup

For backtesting you should enable and configure the following plugins:

 - trading advisor (to run your strategy)
 - profit simulator (to calculate how succesfull the strategy would have been)

## Historical data

Gekko requires historical data to backtest strategies against. The easiest way to get this is to run Gekko on real markets with the plugin sqliteWriter enabled (this will cause Gekko to store realtime data on disk).

## Configure

In your config set the `backtest.daterange` properties.

## Run

    node gekko --backtest