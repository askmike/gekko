import Vue from 'vue'
import _ from 'lodash';
const reduceState = require('../../../../../state/reduceState');

export const syncGekkos = (state, gekkos) => {
  state.gekkos = gekkos;
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
  state.gekkos = {
    ...state.gekkos,
    [update.id]: reduceState(state.gekkos[update.id], update.event)
  }
  return state;
}

export const deleteGekko = (state, id) => {
  state.finishedGekkos = {
    ...state.finishehdGekkos,
    [id]: state.gekkos[id]
  }

  state.gekkos = _.omit(state.gekkos, id)
  return state;
}