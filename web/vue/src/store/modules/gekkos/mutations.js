import Vue from 'vue'
import reduceState from '../../../../../state/reduceState'

export const syncGekkos = (state, gekkos) => {
  state.gekkos = gekkos;
  return state;
}

export const addGekko = (state, gekko) => {
  state.gekkos[gekko.id] = gekko;
  return state;
}

export const updateGekko = (state, update) => {
  state.gekkos[update.id] = reduceState(state.gekkos[update.id], update.event);
  return state;
}