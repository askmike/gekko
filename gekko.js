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

var gekkoDir = './';
var coreDir = gekkoDir + 'core/';
var pluginDir = gekkoDir + 'plugins/';

var _ = require('lodash');
var async = require('async');

var util = require(coreDir + 'util');
var log = require(coreDir + 'log');

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

// temp at Fri Jan 17 16:00:19 CET 2014
if(config.normal)
  util.die('Please update your config! config.normal is now called config.watch');
if(config.EMA)
  util.die('Please update your config! EMA is now called DEMA');
// temp at Wed Jan 22 12:18:08 CET 2014
if(!config.profitSimulator.slippage)
  util.die('Please update your config! The profit simulator is missing slippage');

// START

log.info('Gekko v' + util.getVersion(), 'started');
log.info('I\'m gonna make you rich, Bud Fox.', '\n\n');

var gekkoMode = 'realtime';

// currently we only support a single 
// market and a single advisor.

// make sure the monitoring exchange is configured correctly for monitoring

var exchangeChecker = require(coreDir + 'exchangeChecker');
var invalid = exchangeChecker.cantMonitor(config.watch);
if(invalid)
  util.die(invalid);

var plugins = [];
var emitters = {};

var setupMarket = function(next) {
  var Market = require(coreDir + 'marketManager');
  emitters.market = new Market;
  next();
}

// load each plugin
var loadPlugins = function(next) {
  var pluginSettings = require(gekkoDir + 'plugins');

  var iterator = function(plugin, next) {

    // verify the actor settings in config
    if(!(plugin.slug in config)) {
      log.warn('unable to find', plugin.slug, 'in the config. Is your config up to date?')
      return next();
    }

    var pluginConfig = config[plugin.slug];

    // only load actors that are supported by
    // Gekko's current mode
    if(!_.contains(plugin.modes, gekkoMode))
      return next();

    // if the actor is disabled skip as well
    if(!pluginConfig.enabled)
      return next();

    // verify plugin dependencies are installed
    if('dependencies' in plugin)
      _.each(plugin.dependencies, function(dep) {
        try {
          require(dep.module);
        }
        catch(e) {

          var error = [
            'The plugin',
            plugin.slug,
            'expects the module',
            dep.module,
            'to be installed.',
            'However it is not, install',
            'it by running: \n\n',
            '\tnpm install',
            dep.module + '@' + dep.version
          ].join(' ');

          util.die(error);
        }

      });

    var Plugin = require(pluginDir + plugin.slug);

    if(!plugin.silent) {
      log.info('Setting up:');
      log.info('\t', plugin.name);
      log.info('\t', plugin.description);
    }

    if(plugin.async) {
      var instance = new Plugin(util.defer(next));

      instance.meta = plugin;
      plugins.push(instance);

    } else {
      var instance = new Plugin;

      instance.meta = plugin;
      plugins.push(instance);

      _.defer(next);
    }

    if(!plugin.silent)
      console.log();
  }

  async.eachSeries(
    pluginSettings,
    iterator,
    next
  );
};

// advisor is a special actor in that it spawns an
// advice feed which everyone can subscribe to.
var setupAdvisor = function(next) {

  var settings;

  var plugin = _.find(plugins, function(advisor) {
    if(!advisor.meta.originates)
      return false;

    settings = _.find(
      advisor.meta.originates,
      function(o) {
        return o.feed === 'advice feed'
      }
    );
    return settings;
  });

  emitters.advisor = settings ? plugin[settings.object] : false;

  next();
}

var attachPlugins = function(next) {

  var subscriptions = require(gekkoDir + 'subscriptions');

  _.each(plugins, function(plugin) {
    _.each(subscriptions, function(sub) {

      if(sub.handler in plugin) {

        // if the actor wants to listen
        // to something disabled
        if(!emitters[sub.emitter])
          return log.warn([
            plugin.meta.name,
            'wanted to listen to the',
            sub.emitter + ',',
            'however the',
            sub.emitter,
            'is disabled.'
          ].join(' '))
        
        // attach handler
        emitters[sub.emitter]
          .on(sub.event, plugin[sub.handler]);
      }

    });
  });

  next();
}

log.info('Setting up Gekko in', gekkoMode, 'mode');
console.log();

async.series(
  [
    loadPlugins,
    setupAdvisor,
    setupMarket,
    attachPlugins
  ],
  function() {
    // everything is setup!
    emitters.market.start();
  }
);