export const addWatcher = (state, watcher) => {
  state.watchers.push(watcher);
  return state;
}

export const syncWatchers = (state, watchers) => {
  state.watchers = watchers;
  return state;
}

export const updateWatcher = (state, update) => {
  let item = state.watchers.find(i => i.id === update.gekko_id);
  if(!item)
    return state;
  _.merge(item, update.updates);
  return state;
}