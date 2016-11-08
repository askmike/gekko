const _ = require('lodash');
const promisify = require('tiny-promisify');
const pipelineRunner = promisify(require('../../core/workers/pipeline/parent'));

const broadcast = require('../cache').get('broadcast');

// starts an import
// requires a post body with a config object
module.exports = function *() {
  let mode = 'importer';

  let config = require('./baseConfig');

  _.merge(config, this.request.body);

  let rnd = (Math.random() + '').slice(3);
  let importId = `${config.watch.exchange}:${config.watch.currency}/${config.watch.asset}-${rnd}`;

  pipelineRunner(mode, config, (err, event) => {
    if(err)
      throw err;

    event.type = 'import_update';
    event.import_id = importId;

    broadcast(event);
  });

  this.body = {
    id: importId
  }
}