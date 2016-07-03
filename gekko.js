/*

  Gekko is a Bitcoin trading bot for popular Bitcoin exchanges written 
  in node, it features multiple trading methods using technical analysis.

  If you are interested in how Gekko works, read more about Gekko's 
  architecture here:

  https://github.com/askmike/gekko/blob/stable/docs/internals/architecture.md

  Disclaimer:

  USE AT YOUR OWN RISK!

  The author of this project is NOT responsible for any damage or loss caused 
  by this software. There can be bugs and the bot may not perform as expected 
  or specified. Please consider testing it first with paper trading and/or 
  backtesting on historical data. Also look at the code to see what how 
  it is working.

*/

var util = require(__dirname + '/core/util');

var dirs = util.dirs();
var pipeline = require(dirs.core + 'pipeline');
var log = require(dirs.core + 'log');

var config = util.getConfig();
var mode = util.gekkoMode();

if(
  config.trader.enabled &&
  !config['I understand that Gekko only automates MY OWN trading strategies']
)
  util.die('Do you understand what Gekko will do with your money? Read this first:\n\nhttps://github.com/askmike/gekko/issues/201');

log.info('Gekko v' + util.getVersion(), 'started');
log.info('I\'m gonna make you rich, Bud Fox.', '\n\n');

pipeline({
  config: config,
  mode: mode
});

