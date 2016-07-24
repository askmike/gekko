var ForkTask = require('relieve').tasks.ForkTask;
var fork = require('child_process').fork;

module.exports = (mode, config, handler) => {
  task = new ForkTask(fork(__dirname + '/child'));

  task.send('start', mode, config);

  task.on('log', handler('log'));
  task.on('candle', handler('candle'));
  task.on('advice', handler('advice'));
  task.on('exit', code => {
    if(code !== 0)
      handler('log')('ERROR, Gekko crashed with an error, please check the console.');

    handler('finished', code);
  });
}