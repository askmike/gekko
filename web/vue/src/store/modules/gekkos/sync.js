import { get } from '../../../tools/ajax'
import store from '../../'
import { bus } from '../../../components/global/ws'
import _ from 'lodash'

const init = () => {
  get('gekkos', (err, resp) => {
    const gekkos = resp;
    store.commit('syncGekkos', gekkos);
  });
}

const sync = () => {
  bus.$on('new_gekko', data => store.commit('addGekko', data.state));
  bus.$on('gekko_event', data => store.commit('updateGekko', data));
  bus.$on('delete_gekko', data => store.commit('deleteGekko', data.id));
}

export default function() {
  init();
  sync();
}