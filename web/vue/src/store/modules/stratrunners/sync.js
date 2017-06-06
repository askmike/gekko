import { get } from '../../../tools/ajax'
import store from '../../'
import { bus } from '../../../components/global/ws'
import _ from 'lodash'

const init = () => {
  get('gekkos', (err, resp) => {
    let runners = _.filter(resp, {type: 'leech'});
    store.commit('syncStratrunners', runners);
  });
}

const sync = () => {

  bus.$on('new_gekko', data => {
    if(data.gekko.type === 'leech')
      store.commit('addStratrunner', data.gekko);
  });

  const update = (data) => {
    store.commit('updateStratrunner', data);
  }

  const trade = (data) => {
    store.commit('addTradeToStratrunner', data);
  }

  const roundtrip = (data) => {
    store.commit('addRoundtripToStratrunner', data);
  }

  bus.$on('report', update);
  bus.$on('trade', trade);
  bus.$on('update', update);
  bus.$on('startAt', update);
  bus.$on('lastCandle', update);
  bus.$on('firstCandle', update);
  bus.$on('roundtrip', roundtrip);
}

export default function() {
  init();
  sync();
}