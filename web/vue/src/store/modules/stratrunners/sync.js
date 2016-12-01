import { get } from '../../../tools/ajax'
import store from '../../'
import { bus } from '../../../components/global/ws'
import _ from 'lodash'

const init = () => {
  get('gekkos', (err, resp) => {
    let watchers = _.filter(resp, {mode: 'leech'});
    store.commit('syncStratrunners', watchers);
  });
}

const sync = () => {
  bus.$on('update', data => {
    if(data.gekko_mode === 'leech')
      store.commit('updateStratrunner', data);
  });
}

export default function() {
  init();
  sync();
}