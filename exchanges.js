// what kind of exchange does Gekko support?
//
// Required parameters per exchange.
//
// name: Proper name of the exchange
// slug: slug name of the exchange (needs to match filename in `gekko/exchanges/`)
// direct: does this exchange support MKT orders?
// infinityOrder: is this an exchange that supports infinity
//    orders? (which means that it will accept orders bigger then
//    the current balance and order at the full balance instead)
// currencies: all the currencies supported by the exchange
//    implementation in gekko.
// assets: all the assets supported by the exchange implementation
//    in gekko.
// pairs: all allowed currency / asset combinatinos that form a market
// providesHistory: If the getTrades can be fed a since parameter
//    that Gekko can use to get historical data, set this to:
//
//    - 'date' // When Gekko can pass in a starting point in time
//             // to start returning data from.
//    - 'tid'  // When Gekko needs to pass in a trade id to act as
//             // a starting point in time.
//    - false  // When the exchange does not support to give back
//             // historical data at all.
// fetchTimespan: if the timespan between first and last trade per
//    fetch is fixed, set it here in minutes.
//
// monitorError: if Gekko is currently not able to monitor this exchange, please set it
//    to an URL explaining the problem.
// tradeError: If gekko is currently not able to trade at this exchange, please set it
//    to an URL explaining the problem.
var exchanges = [
  {
    name: 'MtGox',
    slug: 'mtgox',
    direct: true,
    infinityOrder: true,
    currencies: [
      'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY',
      'DKK', 'HKD', 'PLN', 'RUB', 'SGD', 'THB'
    ],
    assets: ['BTC'],
    pairs: [
      ['USD', 'BTC'], ['EUR', 'BTC'], ['GBP', 'BTC'],
      ['AUD', 'BTC'], ['CAD', 'BTC'], ['CHF', 'BTC'],
      ['CNY', 'BTC'], ['DKK', 'BTC'], ['HKD', 'BTC'],
      ['PLN', 'BTC'], ['RUB', 'BTC'], ['SGD', 'BTC'],
      ['THB', 'BTC']
    ],
    requires: ['key', 'secret'],
    minimalOrder: { amount: 0.01, unit: 'asset' },
    providesHistory: false
  },
  {
    name: 'BTC-e',
    slug: 'btce',
    direct: false,
    infinityOrder: false,
    currencies: ['USD', 'RUR', 'EUR', 'BTC'],
    assets: [
      'BTC', 'LTC', 'NMC', 'NVC', 'USD', 'EUR',
      'TRC', 'PPC', 'FTC', 'XPM'
    ],
    pairs: [
      ['USD', 'BTC'], ['RUR', 'BTC'], ['EUR', 'BTC'],
      ['BTC', 'LTC'], ['USD', 'LTC'], ['RUR', 'LTC'],
      ['EUR', 'LTC'], ['BTC', 'NMC'], ['USD', 'NMC'],
      ['BTC', 'NVC'], ['USD', 'NVC'], ['RUR', 'USD'],
      ['USD', 'EUR'], ['BTC', 'TRC'], ['BTC', 'PPC'],
      ['USD', 'PPC'], ['BTC', 'FTC'], ['BTC', 'XPM']
    ],
    requires: ['key', 'secret'],
    minimalOrder: { amount: 0.01, unit: 'asset' },
    providesHistory: false
  },
  {
    name: 'Bitstamp',
    slug: 'bitstamp',
    direct: false,
    infinityOrder: false,
    currencies: ['USD'],
    assets: ['BTC'],
    pairs: [['USD', 'BTC']],
    requires: ['key', 'secret', 'username'],
    minimalOrder: { amount: 1, unit: 'currency' },
    providesHistory: false,
    fetchTimespan: 60
  },
  {
    name: 'CEX.io',
    slug: 'cexio',
    direct: false,
    infinityOrder: false,
    currencies: ['BTC'],
    assets: ['GHS'],
    pairs: [['BTC', 'GHS']],
    requires: ['key', 'secret', 'username'],
    minimalOrder: { amount: 0.000001, unit: 'currency' },
    providesHistory: false
  },
  {
    name: 'Kraken',
    slug: 'kraken',
    direct: false,
    infinityOrder: false,
    currencies: ['XRP', 'EUR', 'KRW', 'USD', 'LTC', 'XVN'],
    assets: ['LTC', 'NMC', 'XBT', 'XVN', 'EUR', 'KRW', 'USD'],
    pairs: [
      [ 'XRP', 'LTC' ], [ 'EUR', 'LTC' ], [ 'KRW', 'LTC' ], [ 'USD', 'LTC' ],
      [ 'XRP', 'NMC' ], [ 'EUR', 'NMC' ], [ 'KRW', 'NMC' ], [ 'USD', 'NMC' ],
      [ 'LTC', 'XBT' ], [ 'NMC', 'XBT' ], [ 'XRP', 'XBT' ], [ 'XVN', 'XBT' ],
      [ 'EUR', 'XBT' ], [ 'KRW', 'XBT' ], [ 'USD', 'XBT' ], [ 'XRP', 'XVN' ],
      [ 'XRP', 'EUR' ], [ 'XVN', 'EUR' ], [ 'XRP', 'KRW' ], [ 'XRP', 'USD' ],
      [ 'XVN', 'USD' ]
    ],
    requires: ['key', 'secret'],
    minimalOrder: { amount: 0.01, unit: 'currency' },
    providesHistory: false
  }
];

module.exports = exchanges;
