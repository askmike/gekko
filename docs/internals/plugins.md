# Plugins

A plugin is a module or plugin that can act upon events bubbling 
through Gekko. If you want to have custom functionality so that your rocket
flies to the moon as soon as the price hits X you should create a plugin for it.

All plugins live in `gekko/plugins`.

## Existing plugins:

- Candle Store: save trades to disk.
- Advice logger: log trading advice in your terminal (stdout).
- Mailer: mail trading advice to your gmail account.
- IRC bot: logs Gekko on in an irc channel and lets users communicate with it.
- Profit simulator: simulates trades and calculates profit over these (and logs profit).
- Trading advisor (internal): calculates advice based on market data.
- Redis beacon (advanced): [see below!](#redis-beacon)

## What kind of events can I listen to?

- `candle`: Everytime Gekko calculated a new 1 minute candle from the market.
- `advice`: Everytime the trading strategy has new advice.

## Implementing a new plugin

**TODO: update**

If you want to add your own plugin you need to expose a constructor function inside
`plugins/[slugname of plugin].js`. The object needs methods based on which event you want
to listen to:

- market feed / candle: `processCandle`.
  This method will be fed a 1 minute candle like:

      {
        start: [moment object of the start time of the candle],
        open: [open of candle],
        high: [high of candle],
        low: [low of candle],
        close: [close of candle],
        vwp: [average weighted price of candle],
        volume: [total volume volume],
        trades: [amount of trades]
      }

  As well as a callback method. You are required to call this method
  once you are done processing the candle.

- advice feed / advice `processAdvice`:
  This method will be fed an advice like:

      {
        recommandation: [position to take, either long or short],
        portfolio: [amount of portfolio you should move to position]
      }

You also need to add an entry for your plugin inside `plugins.js` which tells Gekko a little about
your plugin. Finally you need to add a configuration object to `config.js` with atleast:

    config.[slug name of plugin] = {
      enabled: true
    }

Besides enabled you can also add other configurables here which users can set themselves. 

That's it! Don't forget to create a pull request of the awesome plugin you've just created!