// Everything is explained here:
// https://github.com/askmike/gekko/blob/master/docs/Configuring_gekko.md

var config = {};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          GENERAL SETTINGS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Gekko stores historical history
config.history = {
  // in what directory should Gekko store
  // and load historical data from?
  directory: './history/'
}
config.debug = false; // for additional logging / debugging

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                         WATCHING A MARKET
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Monitor the live market
config.watch = {
  enabled: true,
  exchange: 'Bitstamp', // 'MtGox', 'BTCe', 'Bitstamp' or 'cexio'
  currency: 'USD',
  asset: 'BTC'
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING TRADING ADVICE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.tradingAdvisor = {
  enabled: true,
  method: 'DEMA',
  candleSize: 30,
  historySize: 50
}

// Exponential Moving Averages settings:
config.DEMA = {
  // EMA weight (α)
  // the higher the weight, the more smooth (and delayed) the line
  short: 10,
  long: 21,
  // amount of candles to remember and base initial EMAs on
  // the difference between the EMAs (to act as triggers)
  sellTreshold: -0.025,
  buyTreshold: 0.025
};

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
  verbose: true
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING PLUGINS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Want Gekko to perform real trades on buy or sell advice?
// Enabling this will activate trades for the market being
// watched by config.watch
config.trader = {
  enabled: false,
  key: '',
  secret: '',
  username: '' // your username, only fill in when using bitstamp or cexio
}

config.adviceLogger = {
  enabled: true
}

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

// want Gekko to send a mail on buy or sell advice?
config.mailer = {
  enabled: false, 			// Send Emails if true, false to turn off
  sendMailOnStart: true,		// Send 'Gekko starting' message if true, not if false

  Email: 'me@gmail.com',		// Your GMail address

  // You don't have to set your password here, if you leave it blank we will ask it
  // when Gekko's starts.
  //
  // NOTE: Gekko is an open source project < https://github.com/askmike/gekko >,
  // make sure you looked at the code or trust the maintainer of this bot when you
  // fill in your email and password.
  //
  // WARNING: If you have NOT downloaded Gekko from the github page above we CANNOT
  // guarantuee that your email address & password are safe!

  password: '',				// Your GMail Password - if not supplied Gekko will prompt on startup.

  tag: '[GEKKO] ',			// Prefix all EMail subject lines with this

            //       ADVANCED MAIL SETTINGS
            // you can leave those as is if you 
            // want to use gmail

  // Non-GMail settings - If you are not using GMail you will need to enter the appropriate values below.
  server: 'smtp.gmail.com',		// The name of YOUR outbound (SMTP) mail server.
  smtpauth: true,			// Does SMTP server require authentication (true for GMail)
					// The following 3 values default to the Email (above) if left blank
  user: '',				// Your Email server user name - usually your full Email address 'me@mydomain.com'
  from: '',				// 'me@mydomain.com'
  to: '',				// 'me@somedomain.com, me@someotherdomain.com'
  ssl: true,				// Use SSL (true for GMail)
  port: '',				// Set if you don't want to use the default port
  tls: false				// Use TLS if true
}


config.ircbot = {
  enabled: false,
  emitUpdats: false,
  channel: '#your-channel',
  server: 'irc.freenode.net',
  botName: 'gekkobot'
}

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

// not in a working state
// read: https://github.com/askmike/gekko/issues/156
config.webserver = {
  enabled: false,
  ws: {
    host: 'localhost',
    port: 1338,
  },
  http: {
    host: 'localhost',
    port: 1339,
  }
}




// not working, leave as is
config.backtest = {
  enabled: false
}

module.exports = config;
