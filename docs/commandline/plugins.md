## Enabling plugins

*Note: this documentation was written for running Gekko via the command line. If you are using the UI you do not have to manually select plugins.*

Gekko currently has a couple plugins:

- trading advisor (run a TA strategy against a market)
- trader (execute advice from the TA strategy on a real exchange)
- advice logger
- paper trader
- Mailer
- IRC bot
- Campfire bot
- Redis beacon
- XMP Bot

To configure a plugin, open up your `config.js` file with a text editor and configure the appropiate section.

## Trading Advisor

If you want Gekko to provide automated trading advice you need to configure this in Gekko. Note that this is unrelated to automatic trading which is a plugin that creates order based on this advice. (So if you want automated trading you need both this advice as well as the auto trader.)

Documentation about trading methods in Gekko can be found [here](./Trading_methods.md).

### Trader

This plugin automatically creates orders based on the advice on the market it is watching. This turns Gekko into an automated trading bot.

Before Gekko can automatically trade you need to create API keys so that Gekko has the rights to create orders on your behalf, the rights Gekko needs are (naming differs per exchange): get info, get balance/portfolio, get open orders, get fee, buy, sell and cancel order. For all exchanges you need the API key and the API secret, for both Bitstamp and CEX.io you also need your username (which is a number at Bitstamp).

Configure it like this:

    config.trader = {
      enabled: true,
      key: 'your-api-key',
      secret: 'your-api-secret',
      username: 'your-username' // your username, only fill in when using bitstamp or cexio
    }

- enabled indicates whether this is on or off.
- key is your API key.
- secret is your API secret.
- username is the username (only required for CEX.io and Bitstamp).

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

### Paper trader

The paper trader listens to Gekko's advice and on a sell it will swap all (simulated) currency into (simulated) assets at the current price. On a buy it will be the other way around.

Go to the config and configure it like this:

    // do you want Gekko to calculate the profit of its own advice?
    config.paperTrader = {
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
      feeMaker: 0.5,
      feeTaker: 0.6,
      // Using taker or maker fee?
      feeUsing: 'maker',
      // how much slippage should Gekko assume per trade?
      slippage: 0.1
    }

- enabled indicates whether this is on or off.
- reportInCurrency tells Gekko whether it should report in asset or in the currency.
- simulationBalance tells Gekko with what balance it should start.
- verbose specifies how often Gekko should log the results (false is after every trade, true is after every candle).
- fee is the exchange fee (in %) Gekko should take into considarion when simulating orders.
- slippage is the costs in (in %) associated with not being able to buy / sell at market price.*

*If you are trading a lot and you are buying 100% currency you might not get it all at market price and you have to walk the book in order to take that position. Also note that Gekko uses the candle close price and is unaware of the top asks bids, also take this into account. It is important that you set this number correctly or the resulted calculated profit be very wrong. Read more information [here](http://www.investopedia.com/terms/s/slippage.asp). Take these into consideration when setting a slippage:

- How much spread is there normally on this market?
- How thick is the top of the book normally?
- How volatile is this market (the more volatility the bigger the change you will not get the price you expected)?

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

  > You don't have to set your password here, if you leave it blank we will ask it
  > when Gekko's starts.
  >
  > NOTE: Gekko is an open source project < https://github.com/askmike/gekko >,
  > make sure you looked at the code or trust the maintainer of this bot when you
  > fill in your email and password.
  >
  > WARNING: If you have NOT downloaded Gekko from the github page above we CANNOT
  > guarantuee that your email address & password are safe!

- tag is some text that Gekko will put in all subject lines so you can easily group all advices together.

### IRC bot

IRC bot is a small plugin that connects Gekko to an IRC channel and lets users interact with it using basic commands.

    config.ircbot = {
      enabled: false,
      emitUpdates: false,
      channel: '#your-channel',
      server: 'irc.freenode.net',
      botName: 'gekkobot'
    }

- enabled indicates whether this is on or off.
- emitUpdates tells Gekko that whenever there is a new advice it should broadcast this in the channel.
- channel is the IRC channel the bot will connect to.
- server is the IRC server.
- botName is the username Gekko will use.

### Campfire bot

Campfire bot is a small plugin that connects Gekko to a Campfire room and lets users interact with it using basic commands.

    config.campfire = {
      enabled: false,
      emitUpdates: false,
      nickname: 'Gordon',
      roomId: 673783,
      apiKey: 'e3b0c44298fc1c149afbf4c8996',
      account: 'your-subdomain'
    }

- enabled indicates whether this is on or off.
- emitUpdates tells Gekko that whenever there is a new advice it should broadcast this in the room.
- roomId is the ID of the Campfire room the bot will connect to.
- apiKey is the API key for the Campfire user Gekko will connect using.
- account is the subdomain for the account that the room belongs to.

### Redis beacon

This is an advanced plugin only for programmers! If you are interested in this read more [here](https://github.com/askmike/gekko/blob/stable/docs/internals/plugins.md#redis-beacon).

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
