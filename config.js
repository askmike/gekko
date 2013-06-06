// Everything is explained here:
// https://github.com/askmike/gekko/blob/master/docs/Configuring_gekko.md

var config = {};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                           NORMAL ZONE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Gekko currently only supports Exponential Moving Averages
config.tradingMethod =  'Exponential Moving Averages';

// Exponential Moving Averages settings:
config.EMA = {
  // timeframe per candle
  interval: 60, // in minutes
  // EMA weight (α)
  // the higher the weight, the more smooth (and delayed) the line
  shortEMA: 10,
  longEMA: 21,
  // amount of samples to remember and base initial EMAs on
  ticks: 100,
  // max difference between first and last trade to base price calculation on
  sampleSize: 10, // in seconds
  // the difference between the EMAs (to act as triggers)
  sellTreshold: -0.25,
  buyTreshold: 0.25
};

config.normal = {
  enabled: true,
  exchange: 'MtGox', // 'MtGox', 'BTCe' or 'Bitstamp'
  currency: 'USD',
  asset: 'BTC',
  key: '',
  secret: '',
}

// example Bitstamp Config:

// config.normal = {
//   enabled: true,
//   exchange: 'Bitstamp',
//   currency: 'USD',
//   asset: 'BTC',
//   user: '',
//   password: '',
// }

// want Gekko to send a mail on buy or sell advice?
config.mail = {
  enabled: false,
  email: '', // only works for Gmail or Google apps accounts at the moment

  // You don't have to set your password here, if you leave it blank we will ask it
  // when Gekko's starts.
  //
  // NOTE: Gekko is an open source project < https://github.com/askmike/gekko >,
  // make sure you looked at the code or trust the maintainer of this bot when you
  // fill in your email and password.
  //
  // WARNING: If you have NOT downloaded Gekko from the github page above we CANNOT
  // garantuee that your email address & password are safe!
  password: ''
}

// do you want Gekko to calculate the profit of its own advice?
config.profitCalculator = {
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
  verbose: true
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                           ADVANCED ZONE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
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
  }
];

config.debug = false; // for additional logging / debugging

module.exports = config;