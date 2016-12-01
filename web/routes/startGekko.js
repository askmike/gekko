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
  const mode = this.request.body.mode;

  let config = {}

  _.merge(config, base, this.request.body);

  const id = (Math.random() + '').slice(3);

  let errored = false;

  console.log('Gekko', id, 'started');

  pipelineRunner(mode, config, (err, event) => {

    console.log('EVENT', err, event);

    if(err) {
      if(errored)
        return;

      errored = true;
      console.error('RECEIVED ERROR IN GEKKO', id);
      console.error(err);
      gekkoManager.delete(id);
      return broadcast({
        type: 'gekko_error',
        gekko_id: id,
        error: err
      });
    }

    if(!event)
      return;

    if(event.type === 'update' || event.type === 'startAt') {

      let updates = {};

      if(event.type === 'update') {
        updates.latest = event.latest;
      } else if(event.type === 'startAt') {
        updates.startAt = event.startAt;
      }

      gekkoManager.update(id, updates);
      // emit update over ws
      let wsEvent = {
        type: event.type,
        gekko_id: id,
        gekko_mode: mode,
        emitter: 'gekko',
        updates
      }
      broadcast(wsEvent);
      return;
    }

    // else we ignore (for now)
  });

  const now = moment.utc().format();

  const gekko = {
    watch: config.watch,
    id,
    startAt: '',
    latest: '',
    mode
  }

  gekkoManager.add(gekko);

  broadcast({
    type: 'new_gekko',
    gekko
  });

  this.body = {status: 'ok'};
}