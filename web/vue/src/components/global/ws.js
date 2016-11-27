import _ from 'lodash'
import Vue from 'vue'

import { wsPath } from '../../tools/api'

var socket = null;

export const bus = new Vue();

bus.$on('gekko_update', data => console.log(data))
bus.$on('gekko_error', data => {
  alert('GEKKO ERROR: ' + data.error);
})

bus.$on('import_update', data => console.log(data))
bus.$on('import_error', data => {
  alert('IMPORT ERROR: ' + data.error);
})

export const info = {
  connected: false
}

export const connect = () => {
  socket = new ReconnectingWebSocket(wsPath);
  socket.onopen = () => {
    info.connected = true;
  }
  socket.onclose = () => {
    info.connected = false;
  }
  socket.onmessage = function(message) {
    let payload = JSON.parse(message.data);
    bus.$emit(payload.type, payload);
  };
}