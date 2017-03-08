import { get } from '../../../tools/ajax'
import store from '../../'
import { bus } from '../../../components/global/ws'
import _ from 'lodash'

const init = () => {
  get('gekkos', (err, resp) => {
    let watchers = _.filter(resp, {type: 'watcher'});
    store.commit('syncWatchers', watchers);
  });
}

const sync = () => {

  bus.$on('new_gekko', data => {
    if(data.gekko.type === 'watcher')
      store.commit('addWatcher', data.gekko);
  });

  const update = (data) => {
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