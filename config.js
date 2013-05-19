var config = {};

// Gekko currently only supports Exponential Moving Averages
config.tradingMethod =  'Exponential Moving Averages';

// Exponential Moving Averages settings:
config.tradeConfig = {
  // timeframe per candle
  interval: 60, // in minutes
  // EMA weight (α)
  // the higher the weight, the more smooth (and delayed) the line 
  shortEMA: 10,
  longEMA: 21,
  // amount of samples to remember and base initial EMAs on
  candles: 100,
  // max difference between first and last trade to base price calculation on
  sampleSize: 10, // in seconds
  // the difference between the EMAs (to act as triggers)
  sellTreshold: -0.25,
  buyTreshold: 0.25
};

config.debug = false // for additional logging

//    DANGER ZONE
//    
// enable real trading BTC for real USD
// 
// fill in you public and private key from mtgox / btc-e and uncomment to enable
/*
config.traders = [
  {
    exchange: 'MtGox', // either 'BTCe' or 'MtGox'
    key: '',
    secret: ''
  },
  // {
  //   exchange: 'BTCe', // either 'BTCe' or 'MtGox'
  //   key: '',
  //   secret: ''
  // }
];
*/

module.exports = config;