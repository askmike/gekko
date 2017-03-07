import { get } from '../../../tools/ajax'
import store from '../../'
import { bus } from '../../../components/global/ws'

const init = () => {}

const sync = () => {
  bus.$on('WS_STATUS_CHANGE', data => {
    console.log('WS_STATUS_CHANGE', data);
  });
}

export default function() {
  init();
  sync();
}