# Plugins

A plugin is a module or plugin that can act upon events bubbling 
through Gekko. If you want to have custom functionality so that your rocket
flies to the moon as soon as the price hits X you should create a plugin for it.

All plugins live in `gekko/plugins`.

## Existing plugins:

- Advice logger: log trading advice in stdout.
- Mailer: mail trading advice to your gmail account.
- IRC bot: logs Gekko on in an irc channel and lets users communicate with it.
- Profit simulator: simulates trades and calculates profit over these (and logs profit).
- Trading advisor (internal): calculates advice based on market data.
- Redis beacon (advanced): [see below!](#redis-beacon)

## What kind of events can I listen to?

- `trade`: Everytime Gekko refetched an exchange trade data and it has new trades, it will
  propogate the most recent one.
- `candle`: Everytime Gekko calculated a new candle (as defined by the candleSize),
  it is propogated here.
- `small candle`: Everytime Gekko calculated a new small candle (always 1 minute size 
  candles), it is propogated here.
- `advice`: Everytime an implemented trading method suggests you change your position.

## Implementing a new plugin

If you want to add your own plugin you need to expose a constructor function inside
`plugins/[slugname of plugin].js`. The object needs methods based on which event you want
to listen to:

- market feed / trade: `processTrade`.
  This method will be fed a trade like:

      {
        date: [unix timestamp],
        price: [price of asset],
        tid: [trade id],
        amount: [volume of trade]
      }

- market feed / candle: `processCandle`.
  This method will be fed a candle like:

      {
        start: [moment object],
        o: [open of candle],
        h: [high of candle],
        l: [low of candle],
        c: [close of candle],
        p: [average weighted price of candle],
        v: [volume]
      }

- market feed / small candle: `processSmallCandle`.
  This method will be fed a candle like:

      {
        start: [moment object],
        o: [open of candle],
        h: [high of candle],
        l: [low of candle],
        c: [close of candle],
        p: [average weighted price of candle],
        v: [volume]
      }

- advice feed / advice `processAdvice`:
  This method will be fed an advice like:

      {
        recommandation: [position to take, either long or short],
        portfolio: [amount of portfolio you should move to position]
      }

You also need to add an entry for your plugin inside `plugins.js` which tells Gekko a little about
your plugin. Finally you need to add a close
to `config.js` with atleast:

    config.[slug name of plugin] = {
      enabled: true
    }

Besides enabled you can also add other configurables here which users can set themselves. 

That's it, don't forget to create a pull request of the awesome plugin you've just created!

# Redis Beacon

Gekko also has an plugin which can pipe all events through [redis pubsub](http://redis.io/topics/pubsub), this means that you can also build something on top of Gekko's events with the freedom to:

- Write the plugins in your language of choice (as long as you can connect it to redis).
- Run the plugin outside of the a sandbox / contained environment within Gekko.
- Run plugin on a different machine (scale it, etc)
- Write one which can listen to a cluster Gekkos at the same time.
- *(Theoretical) Create a cluster of Gekkos where a single one fetches market data and all the ones on top run different trading methods.*

