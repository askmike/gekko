const _ = require('lodash');
const fs = require('fs');
const request = require('request-promise');
const Promise = require('bluebird');

request({
  url: 'https://api.pro.coinbase.com/products',
  headers: {
    Connection: 'keep-alive',
    'User-Agent': 'Request-Promise',
  },
  json: true,
})
.then(body => {
  if (!body) {
    throw new Error('Unable to fetch list of assets, response was empty');
  }

  return body;
})
.then(results => {
  let assets = _.uniq(_.map(results, market => {
    return market.base_currency.toUpperCase();
  }));

  let currencies = _.uniq(_.map(results, market => {
    return market.quote_currency.toUpperCase();
  }));

  let markets = _.map(results, market => {
    return {
      pair: [
        market.quote_currency.toUpperCase(),
        market.base_currency.toUpperCase()
      ],
      minimalOrder: {
        amount: market.base_min_size,
        unit: 'asset',
      },
    };
  });

  return { assets: assets, currencies: currencies, markets: markets };
})
.then(markets => {
  fs.writeFileSync('../../wrappers/coinbase-markets.json', JSON.stringify(markets, null, 2));
  console.log(`Done writing Coinbase market data`);
})
.catch(err => {
  console.log(`Couldn't import products from Coinbase`);
  console.log(err);
});

  
