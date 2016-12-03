import { get } from '../../../tools/ajax'
import store from '../../'
import { bus } from '../../../components/global/ws'
import _ from 'lodash'

const init = () => {
  get('gekkos', (err, resp) => {
    let watchers = _.filter(resp, {mode: 'realtime'});
    store.commit('syncWatchers', watchers);
  });
}

const sync = () => {

  bus.$on('new_gekko', data => {
    if(data.gekko.mode === 'realtime')
      store.commit('addWatcher', data.gekko);
  });


  const update = (data) => {
    if(data.gekko_mode === 'realtime')
      store.commit('updateWatcher', data);
  }

  bus.$on('update', update);
  bus.$on('startAt', update);
  bus.$on('lastCandle', update);
  bus.$on('firstCandle', update);
}

export default function() {
  init();
  sync();
}