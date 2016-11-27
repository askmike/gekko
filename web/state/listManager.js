// manages a list of things that change over time
// used for:
// - The currently running imports
// - The currently running gekko watchers
// - The live gekkos
// - etc..
const _ = require('lodash');

var ListManager = function() {
  this._list = [];
}

// add an item to the list
ListManager.prototype.add = function(obj) {
  if(!obj.id)
    return false;
  this._list.push(_.clone(obj));
  return true;
}

// update some properties on an item
ListManager.prototype.update = function(id, updates) {
  let item = this._list.find(i => i.id === id);
  if(!item)
    return false;
  _.merge(item, updates);
  return true;
}

// delete an item from the list
ListManager.prototype.delete = function(id) {
  this._list = this._list.filter(i => i.id !== id);
  return true;
}

// getter
ListManager.prototype.list = function() {
  return this._list;
}

module.exports = ListManager;