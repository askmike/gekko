const _ = require('lodash');
const promisify = require('tiny-promisify');
const pipelineRunner = promisify(require('../../core/workers/pipeline/parent'));

const cache = require('../cache');
const broadcast = cache.get('broadcast');

const base = require('./baseConfig');

// everything is in memory at the moment:
// If Gekko UI crashes the import (in child process)
// will stop anyway
const addImportToCache = _import => {
  let list = cache.get('running_imports');
  list.push(_.clone(_import));
  cache.set('running_imports', list);
}
const updateImportInCache = (id, latest) => {
  let list = cache.get('running_imports');
  let _import = _.find(list, {id: id});
  _import.latest = latest;
  cache.set('running_imports', list);
}
const removeImportFromCache = (id) => {
  let list = cache.get('running_imports');
  cache.set('running_imports', list.filter(im => id !== im.id));
}

// starts an import
// requires a post body with a config object
module.exports = function *() {
  let mode = 'importer';

  let config = {}

  _.merge(config, base, this.request.body);

  let importId = (Math.random() + '').slice(3);

  let errored = false;

  console.log('Import started');

  pipelineRunner(mode, config, (err, event) => {
    if(err) {
      if(errored)
        return;

      errored = true;
      console.error('RECEIVED ERROR IN ROUTE', importId);
      console.error(err);
      removeImportFromCache(importId);
      return broadcast({
        type: 'import_error',
        import_id: importId,
        error: err
      });
    }

    if(event && event.done)
      removeImportFromCache(importId)
    else
      updateImportInCache(importId, event.latest)

    event.type = 'import_update';
    event.import_id = importId;

    broadcast(event);
  });

  let daterange = this.request.body.importer.daterange;

  const _import = {
    watch: config.watch,
    id: importId,
    latest: '',
    from: daterange.from,
    to: daterange.to
  }

  addImportToCache(_import);

  this.body = {
    id: importId
  }
}