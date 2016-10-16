var ForkTask = require('relieve').tasks.ForkTask
var fork = require('child_process').fork

module.exports = function(config, done) {
  task = new ForkTask(fork(__dirname + '/child'));

  task.send('start', config);

  task.once('ranges', ranges => done(false, ranges));
  task.on('exit', code => {

    if(code !== 0)
      handler('log')('ERROR, unable to scan dateranges, please check the console.');
  });
}