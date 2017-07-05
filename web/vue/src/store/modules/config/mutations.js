import Vue from 'vue'

export const syncApiKeys = (state, apiKeys) => {
  Vue.set(state, 'apiKeys', apiKeys);
  return state;
}

export const syncExchanges = (state, exchanges) => {
  Vue.set(state, 'exchanges', exchanges);
  return state;
}