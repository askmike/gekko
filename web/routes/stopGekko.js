const cache = require('../state/cache');
const gekkoManager = cache.get('gekkos');

// stops a Gekko
// requires a post body with an id
module.exports = function *() {

  let id = this.request.body.id;

  if(!id) {
    this.body = { status: 'not ok' }
    return;
  }

  let stopped = gekkoManager.stop(id);

  if(!stopped) {
    this.body = { status: 'not ok' }
    return; 
  }

  this.body = { status: 'ok' };
}