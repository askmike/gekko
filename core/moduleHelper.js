var _ = require('lodash');
var async = require('async');

var util = require('./util');

var log = require(util.dirs().core + 'log');

var config = util.getConfig();
var gekkoMode = util.gekkoMode();

var moduleHelper = {
  // Checks whether we can load a module

  // @param Object module
  //    module config object
  // @return String
  //    error message if we
  //    can't use the module
  isInvalid: function(module) {
    if(!module.internal) {
      // verify the actor settings in config
      if(!(module.slug in config))
        return [
          'unable to find',
          module.slug,
          'in the config. Is your',
          'config up to date?'
        ].join(' ');
    }

    // verify module dependencies are installed
    if(_.has(module, 'dependencies'))
      _.each(module.dependencies, function(dep) {
        try {
          require(dep.module);
        }
        catch(e) {
          return [
            'The plugin',
            module.slug,
            'expects the module',
            dep.module,
            'to be installed.',
            'However it is not, install',
            'it by running: \n\n',
            '\tnpm install',
            dep.module + '@' + dep.version
          ];
        }
      });
  },
  // loads a module
  // 
  // @param Object module
  //    module config object
  // @param Function next
  //    callback
  load: function(module, next) {

    if(!module.silent && !module.internal) {
      log.info('Setting up:');
      log.info('\t', module.name);
      log.info('\t', module.description);
    }

    var isInvalid = moduleHelper.isInvalid(module);

    if(isInvalid)
      return next(isInvalid);

    var Module = require(module.path);

    if(module.async) {
      var instance = new Module(util.defer(function(err) {
        next(err, instance);
      }));

      instance.meta = module;

    } else {
      var instance = new Module;

      instance.meta = module;

      _.defer(function() {
        next(null, instance); 
      });
    }

    if(!module.silent)
      log.empty();
  }
}

module.exports = moduleHelper;