import store from '../../'
import { bus } from '../../../components/global/ws'

const init = () => {}

const sync = () => {
  bus.$on('WS_STATUS_CHANGE', ws => {
    return store.commit('setGlobalWarning', {key: 'connected', value: ws.connected});
  });
}

export default function() {
  init();
  sync();
}