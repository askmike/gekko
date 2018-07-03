import Vue from 'vue'
import _ from 'lodash';
const reduceState = require('../../../../../state/reduceState');

export const syncGekkos = (state, data) => {
  if(!data) {
    return state;
  }

  state.gekkos = data.live;
  state.archivedGekkos = data.archive;
  return state;
}

export const addGekko = (state, gekko) => {
  state.gekkos = {
    ...state.gekkos,
    [gekko.id]: gekko
  }
  return state;
}

export const updateGekko = (state, update) => {
  if(!update.id || !_.has(state.gekkos, update.id)) {
    return console.error('cannot update unknown gekko..');;
  }

  state.gekkos = {
    ...state.gekkos,
    [update.id]: reduceState(state.gekkos[update.id], update.event)
  }
  return state;
}

export const archiveGekko = (state, id) => {
  if(!_.has(state.gekkos, id)) {
    return console.error('cannot archive unknown gekko..');
  }

  state.archivedGekkos = {
    ...state.archivedGekkos,
    [id]: {
      ...state.gekkos[id],
      stopped: true,
      active: false
    }
  }

  state.gekkos = _.omit(state.gekkos, id);
  return state;
}

export const errorGekko = (state, data) => {
  if(!_.has(state.gekkos, data.id)) {
    return console.error('cannot error unknown gekko..');
  }

  state.gekkos = {
    ...state.gekkos,
    [data.id]: {
      ...state.gekkos[data.id],
      errored: true,
      errorMessage: data.error
    }
  }

  return state;
}

export const deleteGekko = (state, id) => {
  if(!_.has(state.archivedGekkos, id)) {
    return console.error('cannot delete unknown gekko..');
  }

  state.archivedGekkos = _.omit(state.archivedGekkos, id);
  return state;
}