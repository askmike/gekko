const fs = require('fs');
const _ = require('lodash');
const toml = require('toml');

const util = require('../util');
const dirs = util.dirs();

const getTOML = function(fileName) {
  var raw = fs.readFileSync(fileName);
  return toml.parse(raw);
}

// build a config object out of a directory of TOML files
module.exports = function() {
  const configDir = util.dirs().config;

  let _config = getTOML(configDir + 'general.toml');
  fs.readdirSync(configDir + 'plugins').forEach(function(pluginFile) {
    let pluginName = _.first(pluginFile.split('.'))
    _config[pluginName] = getTOML(configDir + 'plugins/' + pluginFile);
  });

  // attach the proper adapter
  let adapter = _config.adapter;
  _config[adapter] = getTOML(configDir + 'adapters/' + adapter + '.toml');

  if(_config.tradingAdvisor.enabled) {
    // also load the strat
    let strat = _config.tradingAdvisor.method;
    let stratFile = configDir + 'strategies/' + strat + '.toml';
    if(!fs.existsSync(stratFile))
      util.die('Cannot find the strategy config file for ' + strat);
    _config[strat] = getTOML(stratFile);
  }

  const mode = util.gekkoMode();

  if(mode === 'backtest')
    _config.backtest = getTOML(configDir + 'backtest.toml');

  return _config;
}