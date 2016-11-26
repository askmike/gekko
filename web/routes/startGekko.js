const _ = require('lodash');
const promisify = require('tiny-promisify');
const moment = require('moment');

const pipelineRunner = promisify(require('../../core/workers/pipeline/parent'));
const cache = require('../cache');
const broadcast = cache.get('broadcast');

const base = require('./baseConfig');

// everything is in memory at the moment:
// If Gekko UI crashes the import (in child process)
// will stop anyway
const addGekkoToCache = gekko => {
  let list = cache.get('live_gekkos');
  list.push(_.clone(gekko));
  cache.set('live_gekkos', list);
}
const updateGekkoInCache = (id, updates) => {
  console.log('UPDATING', updates)
  let list = cache.get('live_gekkos');
  let gekko = _.find(list, {id: id});
  _.merge(gekko, updates);
  cache.set('live_gekkos', list);
}
const removeGekkoFromCache = (id) => {
  let list = cache.get('live_gekkos');
  cache.set('live_gekkos', list.filter(im => id !== im.id));
}

// starts an import
// requires a post body with a config object
module.exports = function *() {
  let mode = 'realtime';

  let config = {}

  _.merge(config, base, this.request.body);

  let importId = (Math.random() + '').slice(3);

  let errored = false;

  console.log('Gekko', importId, 'started');

  pipelineRunner(mode, config, (err, event) => {
    console.log(event);
    if(err) {
      if(errored)
        return;

      errored = true;
      console.error('RECEIVED ERROR IN ROUTE', importId);
      console.error(err);
      removeGekkoFromCache(importId);
      return broadcast({
        type: 'gekko_error',
        gekko_id: importId,
        error: err
      });
    }

    if(event.type === 'update')
      updateGekkoInCache(importId, {latest: event.latest})

    if(event.type === 'startAt')
      updateGekkoInCache(importId, {startAt: event.startAt})

    event.gekko_id = importId;
    event.emitter = 'gekko';

    broadcast(event);
  });

  const now = moment.utc().format();

  const gekko = {
    watch: config.watch,
    id: importId,
    startAt: '',
    latest: '',
    type: config.type
  }

  addGekkoToCache(gekko);

  this.body = {
    id: importId
  }
}