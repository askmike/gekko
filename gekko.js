/*

  Gekko is a Bitcoin trading bot for popular Bitcoin exchanges written 
  in node, it features multiple trading methods using technical analysis.

  Disclaimer:

  USE AT YOUR OWN RISK!

  The author of this project is NOT responsible for any damage or loss caused 
  by this software. There can be bugs and the bot may not perform as expected 
  or specified. Please consider testing it first with paper trading / 
  backtesting on historical data. Also look at the code to see what how 
  it's working.

*/

var util = require('./core/util');
var dirs = util.dirs();

var _ = require('lodash');
var async = require('async');

var log = require(dirs.core + 'log');

var moduleHelper = require(dirs.core + 'moduleHelper');

// if the user just wants to see the current version
if(util.getArgument('v')) {
  util.logVersion();
  util.die();
}

// make sure the current node version is recent enough
if(!util.recentNode())
  util.die([
    'Your local version of nodejs is to old. ',
    'You have ',
    process.version,
    ' and you need atleast ',
    util.getRequiredNodeVersion()
  ].join(''));

var config = util.getConfig();

// Temporary checks to make sure everything we need is
// up to date and present on the system.

// temp at Fri Jan 17 16:00:19 CET 2014
if(config.normal)
  util.die('Please update your config! config.normal is now called config.watch');
if(config.EMA)
  util.die('Please update your config! EMA is now called DEMA');
// temp at Wed Jan 22 12:18:08 CET 2014
if(!config.profitSimulator.slippage)
  util.die('Please update your config! The profit simulator is missing slippage');
// temp at Sun Feb  9 17:13:45 CET 2014
if(!config.DEMA.thresholds)
  util.die('Please update your config!');
// temp at Sun Feb 23 14:39:09 CET 2014
if(!config.RSI)
  util.die('Please update your config!');

if(
  config.trader.enabled &&
  !config['I understand that Gekko only automates MY OWN trading strategies']
)
  util.die('Do you understand what Gekko will do with your money? Read this first:\n\nhttps://github.com/askmike/gekko/issues/201');

// START

log.info('Gekko v' + util.getVersion(), 'started');
log.info('I\'m gonna make you rich, Bud Fox.', '\n\n');

// currently we only support a single 
// market and a single advisor.

// make sure the monitoring exchange is configured correctly for monitoring

var exchangeChecker = require(dirs.core + 'exchangeChecker');
var invalid = exchangeChecker.cantMonitor(config.watch);

var BudFox = require(dirs.budfox + 'budfox');

function StringifyStream(){
    require('stream').Transform.call(this);
    this._readableState.objectMode = false;
    this._writableState.objectMode = true;
}
require('util').inherits(StringifyStream, require('stream').Transform);
StringifyStream.prototype._transform = function(obj, encoding, cb){
    this.push(JSON.stringify(obj) + '\n');
    cb();
};

new BudFox(config.watch)
  .start()
  .pipe(new require('stringify-stream')())
  .pipe(process.stdout);

return;


var modules = [];
var emitters = {};

// load each module (plugins and internal parts)
var loadModules = function(next) {
  // get internal modules
  var moduleSettings = _.map(require(dirs.core + 'modules'), function(s) {
    s.internal = true;
    s.path = dirs.core + s.slug;
    return s;
  });

  // transform plugins into modules
  var pluginSettings = _.map(require(dirs.gekko + 'plugins'), function(s) {
    s.path = dirs.plugins + s.slug;
    return s;
  });

  // only load enabled plugin
  pluginSettings = _.filter(pluginSettings, function(s) {
    return s.enabled;
  });

  // append enabled plugins to modules
  moduleSettings = moduleSettings.concat(pluginSettings);

  // load all modules
  async.mapSeries(
    moduleSettings,
    moduleHelper.load,
    function(error, _modules) {
      if(error)
        return util.die(error);

      modules = _modules;
      next();
    }
  );
};

// Emitters are modules that emit events to which others can subscribe.
var setupEmitters = function(next) {

  _.each(modules, function(module) {
    if(module.meta.emits)
      emitters[module.meta.slug] = module;
  });

  next();
}

var subscribeModules = function(next) {

  var subscriptions = require(dirs.core + 'subscriptions');

  _.each(modules, function(module) {
    _.each(subscriptions, function(sub) {

      if(_.has(module, sub.handler)) {

        // if the actor wants to listen
        // to something disabled
        if(!emitters[sub.emitter]) {
          if(!module.meta.internal)
            return log.warn([
              module.meta.name,
              'wanted to listen to the',
              sub.emitter + ',',
              'however the',
              sub.emitter,
              'is disabled.'
            ].join(' '))

          return;
        }

        // attach handler
        emitters[sub.emitter]
          .on(sub.event,
            util.defer(
              module[
                sub.handler
              ])
            );
      }

    });
  });

  next();
}

log.info('Setting up Gekko in', util.gekkoMode(), 'mode');
log.empty();

async.series(
  [
    loadModules,
    setupEmitters,
    subscribeModules
  ],
  function() {
    // everything is setup!
    emitters.heart.start();
  }
);