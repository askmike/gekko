# Actors

An actor is a module or plugin that can act upon events bubbling 
through Gekko. If you want to have custom functionality so that your rocket
flies to the moon as soon as the price hits X you should create an actor for it.

All actors live in `gekko/actors`.

## Existing actors:

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

## Implementing a new actor

If you want to add your own actor you need to expose a constructor function inside
`actors/[slugname of actor].js`. The object needs methods based on which event you want
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

You also need to add an entry for your actor inside `actors.js` which explains to Gekko
to what feed it wants to listen and some meta information. Finally you need to add a close
to `config.js` with atleast:

    config.[slug name of actor] = {
      enabled: true
    }

Besides enabled you can also add other configurables here which users can set themselves. 

That's it, don't forget to create a pull request of the awesome actor you've just created!

# Redis Beacon

Gekko also has an actor which can pipe all events through [redis pubsub](http://redis.io/topics/pubsub), this means that you can also build something on top of Gekko's events with the freedom to:

- Write the actors in your language of choice (as long as you can connect it to redis).
- Run the actor in a sandbox / contained environment.
- Run the actor on a different machine (scale it, etc)
- Write one actor which can listen to a cluster Gekkos at the same time.
- *(Theoretical) Create a cluster of Gekkos where a single one fetches market data and all the ones on top run different trading methods.*

