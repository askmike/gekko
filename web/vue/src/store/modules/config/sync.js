import { get } from '../../../tools/ajax'
import store from '../../'
import { bus } from '../../../components/global/ws'

const transformMarkets = backendData => {
  var exchangesRaw = backendData;
  var exchangesTemp = {};

  exchangesRaw.forEach(e => {
    exchangesTemp[e.slug] = exchangesTemp[e.slug] || {markets: {}};

    e.markets.forEach( pair => {
      let [ currency, asset ] = pair['pair'];
      exchangesTemp[e.slug].markets[currency] = exchangesTemp[e.slug].markets[currency] || [];
      exchangesTemp[e.slug].markets[currency].push( asset );
    });

    exchangesTemp[e.slug].importable = e.providesFullHistory ? true : false;
    exchangesTemp[e.slug].tradable = e.tradable ? true : false;
    exchangesTemp[e.slug].requires = e.requires;
  });

  return exchangesTemp;
}


const init = () => {
  get('apiKeys', (err, resp) => {
    store.commit('syncApiKeys', resp);
  });

  get('exchanges', (err, resp) => {
    store.commit('syncExchanges', transformMarkets(resp));
  })
}

const sync = () => {
  bus.$on('apiKeys', data => {
    store.commit('syncApiKeys', data.exchanges);
  });
}

export default function() {
  init();
  sync();
}