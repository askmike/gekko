# Plugins

A plugin is a low level module or plugin that can act upon events bubbling
through Gekko. If you want to have custom functionality so that your rocket
flies to the moon as soon as the price hits X you should create a plugin for it.

All plugins live in `gekko/plugins`.

Note that in order to use custom plugins, you have to run Gekko over [the commandline](../commandline/about_the_commandline.md).

## Existing plugins:

- Candle Store: save trades to disk.
- Mailer: mail trading advice to your gmail account.
- Pushbullet: send messages to Pushbullet devices.
- Telegram: send messages over Telegram.
- IRC bot: logs Gekko on in an irc channel and lets users communicate with it.
- Paper Trader: simulates trades and calculates profit over these (and logs profit).
- Trading advisor (internal): calculates advice based on market data.
- Redis beacon (advanced): [see below!](#redis-beacon)

*And more! Take a look in the `gekko/plugins folder.`*

## What kind of events can I listen to?

Note that these are low level internal events to the plugin system, they have overlap with the websocket events being streamed to the UI but are not the same.

- `candle`: Every time Gekko calculated a new 1 minute candle from the market.
- `advice`: Every time the trading strategy has new advice.
- `trade`: Every time a trading plugin (either the live trader or the paper trader) has completed a trade.
- `portfolioUpdate`: Is broadcasted once a trading plugin has an updated portflio.

Each of these events contains a javascript object describing the latest data.

## Implementing a new plugin

If you want to add your own plugin you need to expose a constructor function inside
`plugins/[slugname of plugin].js`. The object needs methods based on which event you want
to listen to:

- market feed / candle: `processCandle(candle, callback)`.
  This method will be fed a minute candles like:

      {
        start: [moment object of the start time of the candle],
        open: [number, open of candle],
        high: [number, high of candle],
        low: [number, low of candle],
        close: [number, close of candle],
        vwp: [number, average weighted price of candle],
        volume: [number, total volume volume],
        trades: [number, amount of trades]
      }

  As well as a callback method. You are required to call this method
  once you are done processing the candle.

- advice feed / advice `processAdvice(advice)`:
  This method will be fed an advice like:

      {
        recommendation: [position to take, either long or short],
        portfolio: [amount of portfolio you should move to position] **DECREPATED**
      }

- trading feed / trade `processTrade(trade)`:
  This method will be fed a trade like:

      {
        action: [either "buy" or "sell"],
        price: [number, price that was sold at],
        date: [moment object, exchange time trade completed at],
        portfolio: [object containing amount in currency and asset],
        balance: [number, total worth of portfolio]
      }

- trading feed / portfolioUpdate `portfolioUpdate(portfolio)`:
  This method will be fed an portfolioUpdate like:

      {
        currency: [number, portfolio amount of currency],
        asset: [number, portfolio amount of asset]
      }

You also need to add an entry for your plugin inside `plugins.js` which registers your plugin for use with Gekko. Finally you need to add a configuration object to `sample-config.js` with at least:

    config.[slug name of plugin] = {
      enabled: true
    }

Besides enabled you can also add other configurables here which users can set themselves. 

That's it! Don't forget to create a pull request of the awesome plugin you've just created!
