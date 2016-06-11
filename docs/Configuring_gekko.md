# Configuring Gekko

*(For backtesting, see this [doc](./Backtesting.md))*.

Configuring Gekko consists of two parts:

- [Watching a market](#watching-a-market)
- [Enabling plugins](#enabling-plugins)

First of all create a copy of `sample-config.js` and name it `config.js`. From now on all changes go to `config.js` file.

## Watching a market

It all starts with deciding which market you want Gekko to monitor, Gekko watches a single market and all advice and price information is based on this market. A market is a currency/asset pair on a supported exchange. The supported exchanges can be found [here](./supported_exchanges.md), and the supported assets and currencies for each exchange can be seen [here](https://github.com/askmike/gekko/blob/stable/exchanges.js).

### Configuring an exchange

Open up the config.js file inside the Gekko directory with a text editor and search for these lines:

    // Monitor the live market
    config.watch = {
      exchange: 'btce',
      currency: 'USD',
      asset: 'BTC'
    }

- `enabled` tells Gekko what market to monitor.
- `exchange` tells Gekko what exchange this market is on, check in supported markets what exchanges are supported.
- `currency` tells Gekko what currency the market you want has.
- `asset` tells Gekko what currency the market you want has.

### Supported markets

A list of all supported exchanges and their markets can be found [here](https://github.com/askmike/gekko/blob/stable/exchanges.js). 

### Enable plugins

Everything Gekko does with market data (trading, emailing, etc.) is handled to plugins. The [plugin documentation](./Plugins.md) explains all plugins gekko has.