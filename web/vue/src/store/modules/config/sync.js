import { get } from '../../../tools/ajax'
import store from '../../'
import { bus } from '../../../components/global/ws'

const transformMarkets = backendData => {
  console.log(backendData);

  var exchangesRaw = backendData;
  var exchangesTemp = {};

  exchangesRaw.forEach(e => {
    exchangesTemp[e.slug] = exchangesTemp[e.slug] || {};

    e.markets.forEach( pair => {
      let [ currency, asset ] = pair['pair'];
      exchangesTemp[e.slug][currency] = exchangesTemp[e.slug][currency] || [];
      exchangesTemp[e.slug][currency].push( asset );
    });
  });

  return exchangesTemp;
}


const init = () => {
  get('apiKeys', (err, resp) => {
    store.commit('syncApiKeys', resp);
  });

  get('exchanges', (err, resp) => {
    console.log(resp);
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