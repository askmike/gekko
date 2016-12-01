import { get } from '../../../tools/ajax'
import store from '../../'
import { bus } from '../../../components/global/ws'

const init = () => {
  get('imports', (err, resp) => {
    store.commit('syncImports', resp);
  });
}

const sync = () => {
  bus.$on('import_update', data => {
    store.commit('updateImport', data);
  });
}

export default function() {
  init();
  sync();
}