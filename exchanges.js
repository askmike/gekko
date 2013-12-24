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
// providesHistory: If the getTrades can be fed a since parameter
//    that Gekko can use to get historical data, set this to:
//    
//    - 'date' // When Gekko can pass in a starting point in time
//             // to start returning data from.
//    - 'tid'  // When Gekko needs to pass in a trade id to act as
//             // a starting point in time.
//    - false  // When the exchange does not support to give back
//             // historical data at all.
// fetchTimespan: if providesHistory is either 'tid' or false and
//    the timespan between first and last trade is fixed, set it
//    here in minutes.
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
    requires: ['key', 'secret'],
    minimalOrder: { amount: 0.01, unit: 'asset' },
    providesHistory: 'date'
  },
  {
    name: 'BTC-e',
    slug: 'btce',
    direct: false,
    infinityOrder: false,
    currencies: ['USD', 'RUR', 'EUR'],
    assets: ['BTC'],
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
    requires: ['key', 'secret', 'username'],
    minimalOrder: { amount: 1, unit: 'currency' },
    providesHistory: false,
    fetchTimespan: 60,
    tradeError: 'https://github.com/askmike/gekko/issues/38#issuecomment-29552100'
  },
  {
    name: 'CEX.io',
    slug: 'cexio',
    direct: false,
    infinityOrder: false,
    currencies: ['BTC'],
    assets: ['GHS'],
    requires: ['key', 'secret', 'username'],
    minimalOrder: { amount: 0.000001, unit: 'currency' },
    providesHistory: false
  }
];

module.exports = exchanges;