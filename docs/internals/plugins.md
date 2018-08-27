# Plugins

*This is a technical document explaining the role of Plugins in the Gekko codebase. For a non technical document about available plugins, see [here](../commandline/plugins.md).*

Within Gekko most functionality is encapsulated into "plugins". These are simple modules that process some data (from [Gekko events](./events.md)) and do something with it. For example emitting a new event or sending a message out to some external service like telegram, or doing a live trade at an exchange.

Whenever you run a Gekko (live trader, paper trader, backtester or importer) you are simply running a number of plugins and feeding them with market data. For a more detailed explanation, see the [architecture doc](./architecture.md).

For example, there is a plugin called the paperTrader which is responsible for simulating trades (used in [backtests](../features/backtesting.md) and [paper trading](../features/paper_trading.md)). It does this by listening to advice events coming from a strategy, and simulating trades whenever they fire (and firing trade events). Find a longer list of plugins that come with Gekko [here](../commandline/plugins.md).

- All plugins are javascript files that expose a constructor function (or ES6 class).
- All plugins are stored in `gekko/plugins`.
- All plugins are described in the file [`gekko/plugins.js`](https://github.com/askmike/gekko/blob/develop/plugins.js), this way Gekko knows how/when the plugin can be used (for example it does not make sense to run a telegram bot that will emit all trades in a backtest).

## Structure of a plugin

A plugin can be a very simple module that simply listens to some event:


    // A plugin that will buy Champagne when we MOON

    // example: doesn't actually work..
    const alexa = require('alexa');

    const MOON = 1000000;

    const Plugin = function() {}

    Plugin.prototype.processPortfolioValueChange = function(event) {
      if(event.value > MOON) {
        alexa.say('Alexa, buy the best Champagne!');
      }
    };

    module.exports = Plugin;

Have a look at the [events doc](./events.md) for all events your plugin can subscribe to. For technical inspiration it's easiest to look at the code of Gekko's plugins (here [`gekko/plugins.js`](https://github.com/askmike/gekko/blob/develop/plugins.js)).