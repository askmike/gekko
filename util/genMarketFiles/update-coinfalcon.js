const _ = require('lodash');
const fs = require('fs');
const request = require('request-promise');
const Promise = require('bluebird');

const options = {
  url: 'https://coinfalcon.com/api/v1/markets',
  headers: {
    Connection: 'keep-alive',
    'User-Agent': 'Request-Promise',
  },
  json: true,
};

request(options)
  .then(body => {
    if (!body && !body.data) {
      throw new Error('Unable to fetch product list, response was empty');
    }

    let assets = _.unique(_.map(body.data, market => market.name.split('-')[0]));
    let currencies = _.unique(_.map(body.data, market => market.name.split('-')[1]));
    let pairs = _.map(body.data, market => {
      var currency = market.name.split('-')[1];
      var asset = market.name.split('-')[0];
      return {
        pair: [currency, asset],
        minimalOrder: {
          amount: parseFloat(market.min_volume),
          price: parseFloat(market.min_price),
          order: 0.0
        },
      };
    });

    return { assets: assets, currencies: currencies, markets: pairs };
  })
  .then(markets => {
    fs.writeFileSync('../../exchanges/coinfalcon-markets.json', JSON.stringify(markets, null, 2));
    console.log(`Done writing CoinFalcon market data`);
  })
  .catch(err => {
    console.log(`Couldn't import products from CoinFalcon`);
    console.log(err);
  });
