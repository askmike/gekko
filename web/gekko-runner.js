var ForkTask = require('relieve').tasks.ForkTask
var fork = require('child_process').fork

module.exports = (mode, config, handler) => {
  task = new ForkTask(fork('../core/gekko-child.js'));

  task.send('start', mode, config);

  task.on('log', handler);
}