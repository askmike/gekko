// Everything is explained here:
// https://github.com/askmike/gekko/blob/master/docs/Configuring_gekko.md

var config = {};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                           NORMAL ZONE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Gekko stores historical history
config.history = {
  // in what directory should Gekko store
  // and load historical data from?
  directory: './history/'
}

config.tradingAdvisor = {
  enabled: true,
  method: 'EMA',
  candleSize: 5,
  historySize: 20
}

// Exponential Moving Averages settings:
config.EMA = {
  // EMA weight (α)
  // the higher the weight, the more smooth (and delayed) the line
  short: 10,
  long: 21,
  // amount of candles to remember and base initial EMAs on
  // the difference between the EMAs (to act as triggers)
  sellTreshold: -0.1,
  buyTreshold: 0.1
};

// MACD settings:
config.MACD = {
  // timeframe per candle
  interval: 1, // in minutes
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

config.adviceLogger = {
  enabled: true
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


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                           ADVANCED ZONE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Backtesting strategies against historical data
//
// Test a strategy on historical data
//
// Read here: https://github.com/askmike/gekko/blob/master/docs/Backtesting.md
//
//          NOTE: THIS FEATURE HAS NOT BEEN PROPERELY TESTED YET, IT IS NOT
//                ADVISED TO MAKE REAL WORLD DECISIONS BASED ON THE RESULTS
//                UNTIL THE CODE HAS BEEN PROVED SOLID.
config.backtest = {
  enabled: false,
  candleFile: 'candles.csv',
  from: '2013-10-01 00:00:00', // YYYY-MM-DD HH:mm:ss
  to: '2013-11-01 00:00:00' // YYYY-MM-DD HH:mm:ss
}

// For when you want to monitor a market but want to act (trade) on a different one
// (or different ones).
//
// Check: https://github.com/askmike/gekko/blob/master/docs/Configuring_gekko.md

// monitor what market?
config.watch = {
  exchange: 'MtGox',
  currency: 'USD',
  asset: 'BTC'
}

// real trading
config.traders = [
  {
    exchange: 'MtGox',
    key: '',
    secret: '',
    currency: 'USD',
    asset: 'BTC',
    enabled: false
  },
  {
    exchange: 'BTCe',
    key: '',
    secret: '',
    currency: 'USD',
    asset: 'BTC',
    enabled: false
  },
  {
    exchange: 'Bitstamp',
    user: '',
    password: '',
    currency: 'USD',
    asset: 'BTC',
    enabled: false
  },
  {
    exchange: 'cex.io',
    key: '',
    secret: '',
    currency: 'BTC',
    asset: 'GHS',
    enabled: false
  }
];

config.debug = true; // for additional logging / debugging

module.exports = config;

