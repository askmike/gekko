import _ from 'lodash'
import Vue from 'vue'

import { wsPath } from './api'

var socket = null;

export const bus = new Vue();

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