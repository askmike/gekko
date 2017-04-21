// this is the exchanges file used by Gekko
import exchangesRaw from '../../../../../../exchanges.js';

const markets = {};
 exchangesRaw.forEach(e => {

  markets[e.slug] = markets[e.slug] || {};

  e.markets.forEach( pair => {
    let [ currency, asset ] = pair['pair'];
    markets[e.slug][currency] = markets[e.slug][currency] || [];
    markets[e.slug][currency].push( asset );
  });
});

export default markets;