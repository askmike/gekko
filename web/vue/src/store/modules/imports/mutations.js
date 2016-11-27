export const addImport = (state, imp) => {
  state.imports.push(imp);
  return state;
}

export const syncImports = (state, imports) => {
  state.imports = imports;
  return state;
}

export const updateImport = (state, update) => {
  let item = state.imports.find(i => i.id === update.import_id);
  if(!item)
    return state;
  _.merge(item, update.updates);
  return state;
}