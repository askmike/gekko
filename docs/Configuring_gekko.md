# Configuring Gekko

*(Note that backtesting is not discussed as it is not implemented yet)*.

Configuring Gekko consists of three parts: 

- [Watching a realtime market](#watching-a-realtime-market)
- [Automate trading advice](#automate-trading-advice)
- [Enabling plugins](#enabling-plugins)

## Watching a realtime market

It all starts with deciding which market you want Gekko to monitor, Gekko watches a single market and all advice / price information and other stuff is based on this market. A market is a currency/asset pair on a supported exchange. Examples are:

- BTC/USD on Mt. Gox
- BTC/USD on BTC-e
- BTC/LTC on BTC-e
- BTC/GHS on CEX.io

### Configuring an exchange

Open up the config.js file inside the Gekko directory with a text editor and search for these lines:

    // Monitor the live market
    config.normal = {
      enabled: true,
      exchange: 'btce', // 'MtGox', 'BTCe', 'Bitstamp' or 'cexio'
      currency: 'USD',
      asset: 'BTC',
      tradingEnabled: false,
      key: 'your-key',
      secret: 'your-secret',
      username: 0, // your username, only fill in when using bitstamp or cexio
    }

- enabled tells gekko it should monitor a market~~, disable for backtesting.~~
- exchange tells Gekko what exchange this market is on, check in supported markets what exchanges are supported.
- currency tells Gekko what currency the market you want has*.
- asset tells Gekko what currency the market you want has*.

**The rest of the config eg. real trading is disabled as this branch is not stable, this means you DON'T need to fill in your API keys / username.**

*Even though Bitcoin is a currency Gekko treats is like an asset when you are trading USD/BTC.

### Supported markets

* Mt. Gox:  
  currencies: USD, EUR, GBP, AUD, CAD, CHF, CNY, DKK, HKD, PLN, RUB, SGD, THB  
  assets: BTC  
  markets: USD/BTC, EUR/BTC, GBP/BTC, AUD/BTC, CAD/BTC, CHF/BTC, CNY/BTC, DKK/BTC, HKD/BTC, PLN/BTC, RUB/BTC, SGD/BTC, THB/BTC.

* BTC-e:  
  currencies: USD, EUR, RUR, BTC  
  assets: BTC, LTC, NMC, NVC, USD, EUR, TRC, PPC, FTC, XPM  
  markets: USD/BTC, RUR/BTC, EUR/BTC, BTC/LTC, USD/LTC, RUR/LTC, EUR/LTC, BTC/NMC, USD/NMC, BTC/NVC, USD/NVC, RUR/USD, USD/EUR, BTC/TRC, BTC/PPC, USD/PPC, BTC/FTC, BTC/XPM.

* Bitstamp:  
  currencies: USD  
  assets: BTC  
  markets: USD/BTC
  
* cex.io:  
  currencies: BTC, *NMC (not yet supported)*  
  assets: GHS  
  markets: BTC/GHS

## Automate trading advice

If you want Gekko to provide automated trading advice you need to configure this here. Note that this has unrelated to automatic trading, ~~though you need to calculate advice if you want to automate trading.~~

Gekko supports a number of technical analysis indicators, currently it supports:

- DEMA (called EMA)
- MACD
- PPO

Open up the config.js file again and look at this part:

    config.tradingAdvisor = {
      enabled: true,
      method: 'EMA',
      candleSize: 5,
      historySize: 20
    }

- enabeld tells gekko it should calculate advice.
- Method tells gekko what indicator it should calculate.
- candleSize tells Gekko the size of the candles (in minutes) you want to calculate the indicator over. If you want MACD advice over hourly candles set this to 60.
- historySize tells gekko how much historical candles Gekko needs before it can calculate the initial advise. This is due to the fact that all current indicators need to have initial data.

### IMPORTANT NOTES

- If you have 60 minutes candles that does not mean you will get advice every 60 minutes. You only get advice if the configured indicator suggests to take a new position.
- All the advice is based on the configured indicators you gave to Gekko. The advice is not me or Gekko saying you should take a certain position in the market. **It is the result of automatically running the indicators you configured on the live market.**
- Gekko calculates the advice silently, but you can turn on plugins that do something with this advice.

### DEMA

This method uses `Exponential Moving Average crossovers` to determine the current trend the
market is in. Using this information it will suggest to ride the trend. Note that this is
not MACD because it just checks whether the longEMA and shortEMA are [threshold]% removed
from eachother.

This method is fairly popular in bitcoin trading due to Bitcointalk user Goomboo. Read more about this method in [his topic](https://bitcointalk.org/index.php?topic=60501.0)

You can configure these parameters for DEMA in config.js:

    config.EMA = {
      // EMA weight (α)
      // the higher the weight, the more smooth (and delayed) the line
      short: 10,
      long: 21,
      // amount of candles to remember and base initial EMAs on
      // the difference between the EMAs (to act as triggers)
      sellTreshold: -0.025,
      buyTreshold: 0.025
    };

- short is the short EMA that moves closer to the real market (including noise)
- long is the long EMA that lags behind the market more but is also more resistant to noise.
- sellTreshold and buyTreshold tells Gekko how big the difference in the lines needs to be for it to be considered a trend. If you set these to 0 each line cross would trigger new advice.

### MACD

This method is similar to DEMA but goes a little further by comparing the difference by an EMA of itself. Read more about it [here](http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:moving_average_conve).

You can configure these parameters for MACD in config.js:

    // MACD settings:
    config.MACD = {
      // EMA weight (α)
      // the higher the weight, the more smooth (and delayed) the line
      short: 10,
      long: 21,
      signal: 9,
      // the difference between the EMAs (to act as triggers)
      sellThreshold: -0.025,
      buyThreshold: 0.025,
      // How many candle intervals until trigger fires
      persistence: 5
    };

- short is the short EMA that moves closer to the real market (including noise)
- long is the long EMA that lags behind the market more but is also more resistant to noise.
- signal is the EMA weight calculated over the difference from short/long.
- sellTreshold and buyTreshold tells Gekko how big the difference in the lines needs to be for it to be considered a trend. If you set these to 0 each line cross would trigger new advice.
- persistence tells Gekko how long the thresholds needs to be met until Gekko considers the trend to be valid.

### PPO

Very similar to MACD but also a little different, read more [here](http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:price_oscillators_pp).

    // PPO settings:
    config.PPO = {
      // EMA weight (α)
      // the higher the weight, the more smooth (and delayed) the line
      short: 12,
      long: 26,
      signal: 9,
      // the difference between the EMAs (to act as triggers)
      sellThreshold: -0.3,
      buyThreshold: 0.3,
      // How many candle intervals until trigger fires
      persistence: 1,
      // Provide debugging output / verbose output
    };

- short is the short EMA that moves closer to the real market (including noise)
- long is the long EMA that lags behind the market more but is also more resistant to noise.
- signal is the EMA weight calculated over the difference from short/long.
- sellTreshold and buyTreshold tells Gekko how big the difference in the lines needs to be for it to be considered a trend. If you set these to 0 each line cross would trigger new advice.
- persistence tells Gekko how long the thresholds needs to be met until Gekko considers the trend to be valid.

## Enabling plugins

Gekko currently has a couple plugins:

- advice logger
- profit simulator
- Mailer
- IRC bot
- Redis beacon

### NOTES

When you turn on a plugin for the first time it might be that you need to install some additional dependencies. Copy paste what Gekko tells you!

### Advice logger

The advice logger is a small plugin that logs new advice calculated by Gekko as soon as there is any. Go to the config and configure it like this:

    config.adviceLogger = {
      enabled: true
    }

- enabled indicates whether this is on or off.

The advice logged advice will look something like this in the terminal:

    2014-01-15 14:31:44 (INFO): We have new trading advice!
    2014-01-15 14:31:44 (INFO):    Position to take: long
    2014-01-15 14:31:44 (INFO):    Market price: 5.96
    2014-01-15 14:31:44 (INFO):    Based on market time: 2014-01-15 14:31:01

### profit simulator (paper trader)

The calculator listens to Gekko's advice and on a sell it will swap all (simulated) currency into (simulated) assets at the current price. On a buy it will be the other way around.

Go to the config and configure it like this:

    // do you want Gekko to calculate the profit of its own advice?
    config.profitSimulator = {
      enabled: true,
      // report the profit in the currency or the asset?
      reportInCurrency: true,
      // start balance, on what the current balance is compared with
      simulationBalance: {
        // these are in the unit types configured in the watcher.
        asset: 1,
        currency: 100,
      },
      // only want report after a sell? set to `false`.
      verbose: false,
      // how much fee in % does each trade cost?
      fee: 0.6
    }

- enabled indicates whether this is on or off.
- reportInCurrency tells Gekko whether it should report in asset or in currency.
- simulationBalance tells Gekko with what balance it should start.
- verbose specifies how often Gekko should log the results.
- fee is the exchange fee (in %) Gekko should take into considarion when simulating orders.

The output will be something like:

    2013-06-02 18:21:15 (INFO): ADVICE is to SHORT @ 117.465 (0.132)
    2013-06-02 18:21:15 (INFO): (PROFIT REPORT) original balance:    207.465 USD
    2013-06-02 18:21:15 (INFO): (PROFIT REPORT) current balance:     217.465 USD
    2013-06-02 18:21:15 (INFO): (PROFIT REPORT) profit:          10.000 USD (4.820%)

### Mailer

Mailer will automatically email you whenever Gekko has a new advice.

    // want Gekko to send a mail on buy or sell advice?
    config.mailer = {
      enabled: false,       // Send Emails if true, false to turn off
      sendMailOnStart: true,    // Send 'Gekko starting' message if true, not if false

      Email: 'me@gmail.com',    // Your GMail address

      // You don't have to set your password here, if you leave it blank we will ask it
      // when Gekko's starts.
      //
      // NOTE: Gekko is an open source project < https://github.com/askmike/gekko >,
      // make sure you looked at the code or trust the maintainer of this bot when you
      // fill in your email and password.
      //
      // WARNING: If you have NOT downloaded Gekko from the github page above we CANNOT
      // guarantuee that your email address & password are safe!

      password: '',       // Your GMail Password - if not supplied Gekko will prompt on startup.
      tag: '[GEKKO] ',      // Prefix all EMail subject lines with this
    }

- enabled indicates whether this is on or off.
- sendMailOnStart will email you right away after Gekko started, you can also use this if you are automatically restarting Gekko to see crash behaviour.
- Email is your email address from which Gekko will send emails (to the same address).
- password is the email password: Gekko needs to login to your account to send emails to you:

  You don't have to set your password here, if you leave it blank we will ask it
  when Gekko's starts.
  
  NOTE: Gekko is an open source project < https://github.com/askmike/gekko >,
  make sure you looked at the code or trust the maintainer of this bot when you
  fill in your email and password.
  
  WARNING: If you have NOT downloaded Gekko from the github page above we CANNOT
  guarantuee that your email address & password are safe!

- tag is some text that Gekko will put in all subject lines so you can easily group all advices together.

### IRC bot

IRC bot is a small plugin that connects Gekko to an IRC channel and lets users interact with it using basic commands.

    config.ircbot = {
      enabled: false,
      emitUpdats: false,
      channel: '#your-channel',
      server: 'irc.freenode.net',
      botName: 'gekkobot'
    }

- enabled indicates whether this is on or off.
- emitUpdates tells Gekko that whenever there is a new advice it should broadcast this in the channel.
- channel is the IRC channel the bot will connect to.
- server is the IRC server.
- botName is the username Gekko will use.


This file will explain all different parameters you can set in the [config](https://github.com/askmike/gekko/blob/master/config.js).

The easiest way to configure Gekko is in the normal zone of the config:

    config.normal = {
      enabled: true,
      exchange: 'MtGox', // 'MtGox', 'BTCe', 'Bitstamp' or 'cexio'
      currency: 'USD',
      asset: 'BTC',
      tradingEnabled: false,
      key: '',
      secret: '',
      username: 0 // only fill this is when using Bitstamp or cexio
    }

### Redis beacon

This is an advanced plugin only for programmers! If you are interested in this read more [here](https://github.com/askmike/gekko/blob/localDB/docs/internals/Actors.md#redis-beacon).

    config.redisBeacon = {
      enabled: false,
      port: 6379, // redis default
      host: '127.0.0.1', // localhost
        // On default Gekko broadcasts
        // events in the channel with
        // the name of the event, set
        // an optional prefix to the
        // channel name.
      channelPrefix: '', 
      broadcast: [
        'small candle'
      ]
    }

- enabled indicates whether this is on or off.
- port is the port redis is running on.
- host is the redis host.
- channelPrefix a string that Gekko will prefix all candles with.
- broadcast is a list of all events you want Gekko to publish.