// this is the exchanges file used by Gekko
import exchangesRaw from '../../../../../exchanges.js';

const markets = {};
 exchangesRaw.forEach(e => {
  markets[e.name] = e.markets.map(m => m.pair.join('/'));
});

export default markets;