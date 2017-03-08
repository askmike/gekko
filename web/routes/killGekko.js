const _ = require('lodash');
const promisify = require('tiny-promisify');
const moment = require('moment');

const pipelineRunner = promisify(require('../../core/workers/pipeline/parent'));
const cache = require('../state/cache');
const broadcast = cache.get('broadcast');
const gekkoManager = cache.get('gekkos');

const base = require('./baseConfig');

// starts an import
// requires a post body with a config object
module.exports = function *() {

  let id = this.request.body.id;

  if(!id) {
    this.body = {
      status: 'not ok'
    }
    return;
  }

  let deleted = gekkoManager.delete(id);

  if(!deleted){
    this.body = {
      status: 'not ok'
    }
    return; 
  }

  broadcast({
    type: 'gekko_killed',
    gekko_id: id
  });

  this.body = {
    status: 'ok'
  };
}