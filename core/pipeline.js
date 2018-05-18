/*

  A pipeline implements a full Gekko Flow based on a config and 
  a mode. The mode is an abstraction that tells Gekko what market
  to load (realtime, backtesting or importing) while making sure
  all enabled plugins are actually supported by that market.

  Read more here:
  https://gekko.wizbit/docs/internals/architecture.html

*/


var util = require('./util');
var dirs = util.dirs();

var _ = require('lodash');
var async = require('async');

var log = require(dirs.core + 'log');

var pipeline = (settings) => {

  var mode = settings.mode;
  var config = settings.config;

  // prepare a GekkoStream
  var GekkoStream = require(dirs.core + 'gekkoStream');

  // all plugins
  var plugins = [];
  // all emitting plugins
  var emitters = {};
  // all plugins interested in candles
  var candleConsumers = [];

  // utility to check and load plugins.
  var pluginHelper = require(dirs.core + 'pluginUtil');

  // meta information about every plugin that tells Gekko
  // something about every available plugin
  var pluginParameters = require(dirs.gekko + 'plugins');
  // meta information about the events plugins can broadcast
  // and how they should hooked up to consumers.
  var subscriptions = require(dirs.gekko + 'subscriptions');

  // Instantiate each enabled plugin
  var loadPlugins = function(next) {
    // load all plugins
    async.mapSeries(
      pluginParameters,
      pluginHelper.load,
      function(error, _plugins) {
        if(error)
          return util.die(error, true);

        plugins = _.compact(_plugins);
        next();
      }
    );
  };

  // Some plugins emit their own events, store
  // a reference to those plugins.
  var referenceEmitters = function(next) {

    _.each(plugins, function(plugin) {
      if(plugin.meta.emits)
        emitters[plugin.meta.slug] = plugin;
    });

    next();
  }

  // Subscribe all plugins to other emitting plugins
  var subscribePlugins = function(next) {

    // events broadcasted by plugins
    var pluginSubscriptions = _.filter(
      subscriptions,
      sub => sub.emitter !== 'market'
    );

    // some events can be broadcasted by different
    // plugins, however the pipeline only allows a single
    // emitting plugin for each event to be enabled.
    _.each(
      pluginSubscriptions.filter(s => _.isArray(s.emitter)),
      subscription => {
        var singleEventEmitters = subscription.emitter
          .filter(s => _.size(plugins.filter(p => p.meta.slug === s)
        ));

        if(_.size(singleEventEmitters) > 1) {
          var error = `Multiple plugins are broadcasting`;
          error += ` the event "${subscription.event}" (${singleEventEmitters.join(',')}).`;
          error += 'This is unsupported.'
          util.die(error);
        } else {
          subscription.emitter = _.first(singleEventEmitters);
        }
      }
    );

    // subscribe interested plugins to
    // emitting plugins
    _.each(plugins, function(plugin) {
      _.each(pluginSubscriptions, function(sub) {

        if(_.has(plugin, sub.handler)) {

          // if a plugin wants to listen
          // to something disabled
          if(!emitters[sub.emitter]) {
            return log.warn([
              plugin.meta.name,
              'wanted to listen to the',
              sub.emitter + ',',
              'however the',
              sub.emitter,
              'is disabled.'
            ].join(' '));
          }

          // attach handler
          emitters[sub.emitter]
            .on(sub.event,
              plugin[
                sub.handler
              ])
        }

      });
    });

    // events broadcasted by the market
    var marketSubscriptions = _.filter(
      subscriptions,
      {emitter: 'market'}
    );

    // subscribe plugins to the market
    _.each(plugins, function(plugin) {
      _.each(marketSubscriptions, function(sub) {

        // for now, only subscribe to candles
        if(sub.event !== 'candle')
          return;

        if(_.has(plugin, sub.handler))
          candleConsumers.push(plugin);

      });
    });

    next();
  }

  // TODO: move this somewhere where it makes more sense
  var prepareMarket = function(next) {
    if(mode === 'backtest' && config.backtest.daterange === 'scan')
      require(dirs.core + 'prepareDateRange')(next);
    else
      next();
  }

  log.info('Setting up Gekko in', mode, 'mode');
  log.info('');

  async.series(
    [
      loadPlugins,
      referenceEmitters,
      subscribePlugins,
      prepareMarket
    ],
    function() {
      // load a market based on the config (or fallback to mode)
      let marketType;
      if(config.market)
        marketType = config.market.type;
      else
        marketType = mode;

      var Market = require(dirs.markets + marketType);

      var market = new Market(config);
      var gekko = new GekkoStream(candleConsumers);

      market
        .pipe(gekko)

        // convert JS objects to JSON string
        // .pipe(new require('stringify-stream')())
        // output to standard out
        // .pipe(process.stdout);

      market.on('end', gekko.finalize);
    }
  );

}

module.exports = pipeline;