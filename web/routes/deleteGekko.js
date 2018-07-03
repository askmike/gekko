const cache = require('../state/cache');
const gekkoManager = cache.get('gekkos');

// Deletes a gekko
// requires a post body with an id
module.exports = function *() {

  let id = this.request.body.id;

  if(!id) {
    this.body = { status: 'not ok' }
    return;
  }

  try {
    gekkoManager.delete(id);
  } catch(e) {
    this.body = { status: e.message }
  }

  this.body = { status: 'ok' };
}