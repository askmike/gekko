export const addStratrunner = (state, runner) => {
  state.stratrunners.push(runner);
  return state;
}

export const syncStratrunners = (state, runners) => {
  state.stratrunners = runners;
  return state;
}

export const updateWatcher = (state, update) => {
  let item = state.stratrunners.find(i => i.id === update.gekko_id);
  if(!item)
    return state;
  _.merge(item, update.updates);
  return state;
}