// Fake exchanges: used to test purposes to develop Gekko (works without internet).

const _ = require('lodash');
const moment = require('moment');
const log = require('../core/log');

const TREND_DURATION = 100;

const Trader = function() {
  this.name = 'Exchange Simulator';
  this.at = moment.utc('1980-01-01');


  // fake data
  this.price = 100;
  this.trend = 'up';
  this.tid = 0;
}

Trader.prototype.getTrades = function(since, cb) {
  const amount = Math.round(Math.random() * 100)

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
      date: this.at.add(30, 'seconds').unix(),
      price: this.price,
      amount: Math.random() * 100,
      tid: this.tid
    }
  });

  log.debug(
    `[EXCHANGE SIMULATOR] emitted ${amount} fake trades, up until ${this.at.format('YYYY-MM-DD HH:mm:ss')}.`
  );

  cb(null, trades);
}

Trader.getCapabilities = function () {
  return {
    name: 'Exchange Simulator',
    slug: 'exchange-simulator',
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

