import store from '../../'
import { bus } from '../../../components/global/ws'

const init = () => {}

var initialConnect = true;

const sync = () => {
  bus.$on('WS_STATUS_CHANGE', ws => {

    if(initialConnect && ws.connected)
      return initialConnect = false;

    if(!ws.connected)
      return store.commit('setGlobalWarning', {key: 'connected', value: false});

    store.commit('setGlobalWarning', {key: 'connected', value: true});
    store.commit('setGlobalWarning', {key: 'reconnected', value: true});
  });
}

export default function() {
  init();
  sync();
}