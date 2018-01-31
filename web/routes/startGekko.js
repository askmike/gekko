const _ = require('lodash');
const promisify = require('tiny-promisify');
const moment = require('moment');

const pipelineRunner = promisify(require('../../core/workers/pipeline/parent'));
const cache = require('../state/cache');
const Logger = require('../state/logger');
const broadcast = cache.get('broadcast');
const apiKeyManager= cache.get('apiKeyManager');
const gekkoManager = cache.get('gekkos');

const base = require('./baseConfig');

// starts an import
// requires a post body with a config object
module.exports = function *() {
  const mode = this.request.body.mode;

  let config = {};

  _.merge(config, base, this.request.body);

  // Attach API keys
  if(config.trader && config.trader.enabled) {

    const keys = apiKeyManager._getApiKeyPair(config.watch.exchange);

    if(!keys) {
      this.body = 'No API keys found for this exchange.';
      return;
    }

    _.merge(
      config.trader,
      keys
    );
  }

  // set type
  if(mode === 'realtime') {
    if(config.market && config.market.type)
      var type = config.market.type;
    else
      var type = 'watcher';
  } else {
    var type = '';
  }

  const id = (Math.random() + '').slice(3);

  let errored = false;

  var logType = type;
  if(logType === 'leech') {
    if(config.trader && config.trader.enabled)
      logType = 'tradebot';
    else
      logType = 'papertrader';
  }
  const logger = new Logger(logType);

  console.log('Gekko', id, 'started');

  const child = pipelineRunner(mode, config, (err, event) => {

    if(err) {
      if(errored)
        return;

      let deleted = gekkoManager.delete(id);

      if(!deleted)
        // it was already deleted
        return;

      errored = true;
      console.error('RECEIVED ERROR IN GEKKO', id);
      console.error(err);
      return broadcast({
        type: 'gekko_error',
        gekko_id: id,
        error: err
      });
    }

    if(event && event.log)
      return logger.write(event.log);

    if(!event || !event.type)
      return;

    if(event.type === 'trade') {
      let trade = event.trade;
      gekkoManager.push(id, 'trades', trade);
      let wsEvent = {
        type: 'trade',
        gekko_id: id,
        gekko_mode: mode,
        gekko_type: type,
        emitter: 'gekko',
        trade
      }
      broadcast(wsEvent);
      return;
    } else if(event.type === 'roundtrip') {
      let roundtrip = event.roundtrip;
      gekkoManager.push(id, 'roundtrips', roundtrip);
      let wsEvent = {
        type: 'roundtrip',
        gekko_id: id,
        gekko_mode: mode,
        gekko_type: type,
        emitter: 'gekko',
        roundtrip
      }
      broadcast(wsEvent);
      return;
    }

    let updates = {};

    if(event.type === 'update') {
      updates.latest = event.latest;
    }  else {
      // all possible events can be found in
      // @file gekko/core/cp.js
      updates[event.type] = event[event.type];
    }


    gekkoManager.update(id, updates);
    // emit update over ws
    let wsEvent = {
      type: event.type,
      gekko_id: id,
      gekko_mode: mode,
      gekko_type: type,
      emitter: 'gekko',
      updates
    }
    broadcast(wsEvent);
  });

  const now = moment.utc().format();

  var gekko = {
    watch: config.watch,
    id,
    startAt: '',
    latest: '',
    mode,
    type
  }

  if(config.tradingAdvisor && config.tradingAdvisor.enabled) {
    gekko.strat = {
      name: config.tradingAdvisor.method,
      tradingAdvisor: config.tradingAdvisor,
      params: config[ config.tradingAdvisor.method ]
    };

    gekko.trades = [];
    gekko.roundtrips = [];

    if(config.trader && config.trader.enabled)
      gekko.trader = 'tradebot';
    else
      gekko.trader = 'paper trader';
  }

  gekkoManager.add(gekko);

  broadcast({
    type: 'new_gekko',
    gekko
  });

  this.body = gekko;
}
