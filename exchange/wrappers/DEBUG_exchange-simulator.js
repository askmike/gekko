// Fake exchanges: used to test purposes to develop Gekko (works without internet).

const _ = require('lodash');
const moment = require('moment');
const log = require('../core/log');

const TREND_DURATION = 1000;

const Trader = function() {
  this.name = 'Exchange Simulator';
  this.at = moment().subtract(30, 'minutes');


  // fake data
  this.price = 100;
  this.trend = 'up';
  this.tid = 0;
}

Trader.prototype.getTrades = function(since, cb) {
  const amount = moment().diff(this.at, 'seconds');

  const trades = _.range(amount).map(() => {

    this.tid++;

    if(this.tid % TREND_DURATION === 0) {
      if(this.trend === 'up')
        this.trend = 'down';
      else
        this.trend = 'up';
    }

    if(this.trend === 'up')
      this.price += Math.random();
    else
      this.price -= Math.random();

    return {
      date: this.at.add(1, 'seconds').unix(),
      price: this.price,
      amount: Math.random() * 100,
      tid: this.tid
    }
  });

  console.log(
    `[EXCHANGE SIMULATOR] emitted ${amount} fake trades, up until ${this.at.format('YYYY-MM-DD HH:mm:ss')}.`
  );

  cb(null, trades);
}

Trader.getCapabilities = function () {
  return {
    name: 'Exchange Simulator',
    slug: 'DEBUG_exchange-simulator',
    currencies: ['USD'],
    assets: ['BTC', 'BTC'],
    maxTradesAge: 60,
    maxHistoryFetch: null,
    markets: [
      { pair: ['USD', 'BTC'], minimalOrder: { amount: 5, unit: 'currency' } },
    ],
    requires: ['key', 'secret', 'username'],
    fetchTimespan: 60,
    tid: 'tid',
    tradable: false
  };
}

module.exports = Trader;

