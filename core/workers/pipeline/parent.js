var fork = require('child_process').fork;

module.exports = (mode, config, callback) => {
  var debug = typeof v8debug === 'object';
  if (debug) {
    process.execArgv = [];
  }

  var child = fork(__dirname + '/child');

  // How we should handle client messages depends
  // on the mode of the Pipeline that is being ran.
  var handle = require('./messageHandlers/' + mode + 'Handler')(callback);

  var message = {
    what: 'start',
    mode: mode,
    config: config
  };

  child.on('message', function(m) {

    if(m === 'ready')
      return child.send(message);

    if(m === 'done')
      return child.send({what: 'exit'});

    handle.message(m);
  });

  child.on('exit', handle.exit);

  return child;
}
