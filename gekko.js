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

if(!util.isInteractive()) {

  var config = util.getConfig();
  var mode = util.gekkoMode();

  pipeline(config, mode);
} else {

  var handle = require(dirs.core + 'interactiveSessionHandler');

  handle(pipeline);
}



// 