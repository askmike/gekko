# Configuring Gekko

*(Note that backtesting is not discussed as it is not implemented yet)*.

Configuring Gekko consists of three parts: 

- [Watching a realtime market](#watching-a-realtime-market)
- [Automate trading advice](#automate-trading-advice)
- [Enabling plugins](#enabling-plugins)

First of all create a copy of `sample-config.js` and name it `config.js`. From now on all changes go to `config.js` file.

## Watching a realtime market

It all starts with deciding which market you want Gekko to monitor, Gekko watches a single market and all advice and price information is based on this market. A market is a currency/asset pair on a supported exchange. The supported exchanges can be found [here](./supported_exchanged.md), and the supported assets and currencies for each exchange can be seen [here](https://github.com/askmike/gekko/blob/stable/exchanges.js).

### Configuring an exchange

Open up the config.js file inside the Gekko directory with a text editor and search for these lines:

    // Monitor the live market
    config.watch = {
      enabled: true,
      exchange: 'btce',
      currency: 'USD',
      asset: 'BTC'
    }

- enabled tells gekko it should monitor a market, ~~disable for backtesting.~~
- exchange tells Gekko what exchange this market is on, check in supported markets what exchanges are supported.
- currency tells Gekko what currency the market you want has*.
- asset tells Gekko what currency the market you want has*.

*Even though Bitcoin is a currency Gekko treats is like an asset when you are trading USD/BTC.

### Supported markets

A list of all supported exchanges and their markets can be found [here](https://github.com/askmike/gekko/blob/stable/exchanges.js). 

### Enable plugins

Everything Gekko does with market data (trading, emailing, etc.) is handled to plugins. The [plugin documentation](https://github.com/askmike/gekko/blob/stable/docs/Plugins.md) explains all plugins gekko has.

### Plugins

Gekko supports a number of see [the plugin documentation](.