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
// pairs: all allowed currency / asset combinations that form a market
// maxHistoryFetch: the parameter fed to the getTrades call to get the max
//    history.
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
    name: 'BTC-e',
    slug: 'btce',
    direct: false,
    infinityOrder: false,
    currencies: ['USD', 'RUR', 'EUR', 'BTC'],
    assets: [
      'BTC', 'LTC', 'NMC', 'NVC', 'USD', 'EUR',
      'TRC', 'PPC', 'FTC', 'XPM'
    ],
    markets: [
      { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['RUR', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['RUR', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'NMC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'NMC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'NVC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'NVC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['RUR', 'USD'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'EUR'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'TRC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'PPC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['USD', 'PPC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'FTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      { pair: ['BTC', 'XPM'], minimalOrder: { amount: 0.1, unit: 'asset' } }
    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    maxHistoryFetch: '?limit=2000',
    tid: 'tid'
  },
  {
    name: 'Bitstamp',
    slug: 'bitstamp',
    direct: false,
    infinityOrder: false,
    currencies: ['USD', 'EUR'],
    assets: ['BTC', 'EUR'],
    maxTradesAge: 60,
    maxHistoryFetch: null,
    markets: [
      { pair: ['USD', 'BTC'], minimalOrder: { amount: 1, unit: 'currency' } },
      { pair: ['EUR', 'BTC'], minimalOrder: { amount: 1, unit: 'currency' } },
      { pair: ['USD', 'EUR'], minimalOrder: { amount: 1, unit: 'currency' } }
    ],
    requires: ['key', 'secret', 'username'],
    providesHistory: false,
    maxHistoryFetch: 'day',
    fetchTimespan: 60,
    tid: 'tid'
  },
  {
    name: 'CEX.io',
    slug: 'cexio',
    direct: false,
    infinityOrder: false,
    currencies: ['BTC','USD','EUR','RUB'],
    assets: ['GHS','BTC','ETH','LTC'],
    markets: [
      { pair: ['BTC', 'GHS'], minimalOrder: { amount: 0.000001, unit: 'currency' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.000001, unit: 'currency' } },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.000001, unit: 'currency' } },
      { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.000001, unit: 'currency' } },
      { pair: ['RUB', 'BTC'], minimalOrder: { amount: 0.000001, unit: 'currency' } },
      { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.000001, unit: 'currency' } },
      { pair: ['EUR', 'BTC'], minimalOrder: { amount: 0.000001, unit: 'currency' } },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.000001, unit: 'currency' } },
      { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.000001, unit: 'currency' } },
      { pair: ['EUR', 'ETH'], minimalOrder: { amount: 0.000001, unit: 'currency' } }
    ],
    requires: ['key', 'secret', 'username'],
    providesHistory: false,
    tid: 'tid'
  },
  {
    name: 'Kraken',
    slug: 'kraken',
    direct: false,
    infinityOrder: false,
    // technically not true..
    currencies: ['ETH', 'XBT', 'CAD', 'EUR', 'GBP', 'JPY', 'XRP', 'XDG', 'XLM', 'USD'],
    assets: ['DAO', 'ETH', 'LTC', 'XBT'],
    markets: [
      { pair: ['ETH', 'DAO'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['XBT', 'DAO'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['CAD', 'DAO'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['EUR', 'DAO'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['GBP', 'DAO'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['JPY', 'DAO'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['USD', 'DAO'], minimalOrder: { amount: 0.01, unit: 'currency' } },

      { pair: ['XBT', 'ETH'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['CAD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['EUR', 'ETH'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['GBP', 'ETH'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['JPY', 'ETH'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'currency' } },

      { pair: ['CAD', 'LTC'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.01, unit: 'currency' } },

      { pair: ['LTC', 'XBT'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['XDG', 'XBT'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['XLM', 'XBT'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['XRP', 'XBT'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['CAD', 'XBT'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['EUR', 'XBT'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['GBP', 'XBT'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['JPY', 'XBT'], minimalOrder: { amount: 0.01, unit: 'currency' } },
      { pair: ['USD', 'XBT'], minimalOrder: { amount: 0.01, unit: 'currency' } }
    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    tid: 'date'
  },
  {
    name: 'Poloniex',
    slug: 'poloniex',
    direct: false,
    infinityOrder: false,
    currencies: ['BTC', 'XMR', 'USDT'],
    assets: ['BTC', 'XMR', 'ETH', 'FCT', 'MAID', 'DASH', 'XVC', 'GRC'],
    markets: [
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'XMR'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'FCT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'MAID'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'DASH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'XVC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'GRC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
    ],
    requires: ['key', 'secret'],
    providesHistory: 'date',
    tid: 'tid',
    // monitorError: 'https://github.com/askmike/gekko/issues/210',
  },
  {
    name: 'Bitfinex',
    slug: 'bitfinex',
    direct: false,
    infinityOrder: false,
    currencies: ['USD', 'BTC'],
    assets: ['BTC', 'LTC', 'ETH'],
    markets: [
        { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' }},
        { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' }},
        { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }},
        { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' }},
        { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }},
    ],
    requires: ['key', 'secret'],
    maxHistoryFetch: 2000,
    tid: 'tid'

  },
  {
    name: 'meXBT',
    slug: 'mexbt',
    direct: false,
    infinityOrder: false,
    currencies: ['MXN'],
    assets: ['BTC'],
    markets: [
      {
        pair: ['MXN', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' }
      }
    ],
    requires: ['key', 'secret', 'username'],
    providesHistory: 'date',
    tid: 'tid'
  },
  {
    name: 'LakeBTC',
    slug: 'lakebtc',
    direct: false,
    infinityOrder: false,
    currencies: ['USD'],
    assets: ['BTC'],
    markets: [
      {
        pair: ['USD', 'BTC'], minimalOrder: { amount: 1, unit: 'currency' }
      }
    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    fetchTimespan: 60,
    tid: 'tid'
  },
  {
    name: 'Zaif.jp',
    slug: 'zaif.jp',
    direct: false,
    infinityOrder: false,
    currencies: ['JPY'],
    assets: ['BTC'],
    markets: [
      {
        pair: ['JPY', 'BTC'], minimalOrder: { amount: 1, unit: 'currency' }
      }
    ],
    requires: ['key', 'secret', 'username'],
    providesHistory: false,
    fetchTimespan: 60,
    tid: 'tid'
  },
  {
    name: 'BTCC',
    slug: 'btcc',
    direct: false,
    infinityOrder: false,
    currencies: ['BTC', 'CNY'],
    assets: ['BTC', 'LTC'],
    markets: [
      { pair: ['CNY', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['CNY', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } }
    ],
    requires: ['key', 'secret'],
    // TODO:
    providesHistory: false,
    fetchTimespan: 60,
    maxHistoryFetch: 5000,
    tid: 'tid'
  },
  {
    name: 'OkCoin',
    slug: 'okcoin',
    direct: false,
    infinityOrder: false,
    currencies: ['BTC', 'CNY'],
    assets: ['BTC', 'LTC'],
    markets: [
      { pair: ['CNY', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } }
    ],
    requires: ['key', 'secret', 'username'],
    // TODO:
    providesHistory: false,
    fetchTimespan: 60,
    maxHistoryFetch: false,
    tid: 'date',
    tradeError: 'NOT IMPLEMENTED YET',
    monitorError: 'Very old code, not working currently.'
  },
  {
    name: 'BitX',
    slug: 'bitx',
    direct: false,
    infinityOrder: false,
    currencies: ['MYR', 'KES', 'NGN', 'ZAR'],
    assets: ['XBT'],
    markets: [
      { pair: ['MYR', 'XBT'], minimalOrder: { amount: 0.00001, unit: 'asset' } },
      { pair: ['XBT', 'KES'], minimalOrder: { amount: 0.00001, unit: 'asset' } },
      { pair: ['XBT', 'NGN'], minimalOrder: { amount: 0.00001, unit: 'asset' } },
      { pair: ['XBT', 'ZAR'], minimalOrder: { amount: 0.00001, unit: 'asset' } }
    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    tid: 'msdate'
  },
  {
    name: 'BX.in.th',
    slug: 'bx.in.th',
    direct: false,
    infinityOrder: false,
    currencies: ['THB'],
    assets: ['BTC'],
    markets: [
      {
        pair: ['THB', 'BTC'], minimalOrder: { amount: 0.0001, unit: 'asset' },
      }
    ],
    requires: ['key', 'secret'],
    tradeError: 'NOT IMPLEMENTED YET',
    providesHistory: false
  }
  // ,
  // ---- Keeping this here for historical purposes. ----
  // {
  //
  //   name: 'MtGox',
  //   slug: 'mtgox',
  //   direct: true,
  //   infinityOrder: true,
  //   currencies: [
  //     'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY',
  //     'DKK', 'HKD', 'PLN', 'RUB', 'SGD', 'THB'
  //   ],
  //   assets: ['BTC'],
  //   markets: [
  //     { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['EUR', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['GBP', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['AUD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['CAD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['CHF', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['CNY', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['DKK', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['HKD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['PLN', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['RUB', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['SGD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['THB', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } }
  //   ],
  //   requires: ['key', 'secret'],
  //   providesHistory: false
  // }
];

module.exports = exchanges;
