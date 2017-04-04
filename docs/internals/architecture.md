# Gekko's architecture

![Gekko architecture](https://wizb.it/gekko/static/architecture.jpg)

Every Gekko instance has two core components:

- A market
- A GekkoStream

Communicaton between those two components is handled by Node.JS' [Stream API](https://nodejs.org/api/stream.html). The Market implements a Readable Stream interface while the GekkoStream implements a Writeable Stream interface.

## A Market

All markets in Gekko eventually output `candle` data. Where these candles come from and how old they are does not matter to the GekkoStream they get piped into. On default Gekko looks for markets in the [`core/markets/` directory](https://github.com/askmike/gekko/tree/stable/core/markets) (but changing that is [not too hard](https://github.com/askmike/gekko/blob/72a858339afb5a856179c716ec4ea13070a6c87c/gekko.js#L48-L49)). The top orange block in the picture is a BudFox market (the default).

Example Markets that come included with Gekko are:

- **BudFox** (a realtime market): this market stays on indefinitely and outputs candles from the live markets in semi-realtime (cryptocurrency exchanges run 24/7).
- **backtest**: this market reads candles from a database and outputs them as fast as the GekkoStream is able to consume them (the GekkoStream will run TA strategies over these candles).
- **importer**: the importer market will fetch historical data from an exchange and pass on (to the GekkoStream who inserts them in a database).

## A GekkoStream

A GekkoStream is nothing more than a collection of [plugins](https://github.com/askmike/gekko/blob/stable/docs/Plugins.md). Plugins are simple modules that can subscribe to events, and do something based on event data. The most basic event every GekkoStream has is the "candle" event, this event comes from the market.

However **plugins are allowed to broadcast their own events, which other plugins can subscribe to**. An example of this is the `tradingAdvisor` plugin. This plugin will implement a [trading method](https://github.com/askmike/gekko/blob/stable/docs/Trading_methods.md) that will be fed candle data. As soon as the trading method suggests to take a certain position in the market ("I detect an uptrend, I advice to go **long**") it will broadcast an `advice` event. The `paperTrader` is a plugin that simulates trading using these advices, the `trader` is a plugin that creates real market orders based on these advices. You can decide to only turn the `paperTrader` on or to turn the `trader` on (you now have a live trading bot).

When you run a backtest using Gekko the following things happen:

- Gekko configures a `backtest` market.
- Gekko loads all configured plugins that are supported in the `backtest` mode* into a GekkoStream.
- Gekko pipes the market into the GekkoStream and voila!

\*Gekko refuses to load plugins that are unsupported in specific modes. During backtests you **never** want to enable the real trader to enter market orders. Because if you would the advice would be based on specific moments in the backtest, not on the current state of the market.

## Plugins & Adapters

Those two core components describe the majority of Gekko's flow. A lot "core functionality" like saving candles to disk are simply plugins that push all candles to a database adapter.

## Seperated architecture

The modular nature of Gekko makes it very dynamic and allows for rapidly creating new plugins. However there is an ugly side to this story:

The `tradingAdvisor` runs TA strategies against a market. The problem however is that most TA indicators need some history before thay can give accurate results. If you want to use an EMA (exponential moving average), you need some history to base the initial average on. But because the tradingAdvisor doesn't know what market data is going to be made available later by the market, it needs to do some fetching itself and compare that to locally available market data (stored in the local database) to see if it can stitch the two sources.