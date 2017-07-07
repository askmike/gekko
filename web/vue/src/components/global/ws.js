import _ from 'lodash'
import Vue from 'vue'

import { wsPath } from '../../tools/api'
import initializeState from '../../store/init'

var socket = null;

export const bus = new Vue();

bus.$on('gekko_update', data => console.log(data))
bus.$on('gekko_error', data => {
  alert('GEKKO ERROR: ' + data.error);
})

bus.$on('import_update', data => console.log(data))
bus.$on('import_error', data => {
  alert('IMPORT ERROR: ' + data.error);
});

const info = {
  connected: false
}


export const connect = () => {
  socket = new ReconnectingWebSocket(wsPath);

  setTimeout(() => {
    // in case we cannot connect
    if(!info.connected) {
      initializeState();
      bus.$emit('WS_STATUS_CHANGE', info);
    }
  }, 500);

  socket.onopen = () => {
    if(info.connected)
      return;

    info.connected = true;
    bus.$emit('WS_STATUS_CHANGE', info);
    initializeState();
  }
  socket.onclose = () => {
    if(!info.connected)
      return;

    info.connected = false;
    bus.$emit('WS_STATUS_CHANGE', info);
  }
  socket.onerror = () => {
    if(!info.connected)
      return;

    info.connected = false;
    bus.$emit('WS_STATUS_CHANGE', info);
  }
  socket.onmessage = function(message) {
    let payload = JSON.parse(message.data);
    bus.$emit(payload.type, payload);
  };
}