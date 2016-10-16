var fork = require('child_process').fork;

module.exports = (mode, config, callback) => {
  var child = fork(__dirname + '/child');

  var message = {
    what: 'start',
    mode: mode,
    config: config
  }

  child.on('message', function(m) {

    if(m === 'ready') {
      return child.send(message);
    }

  });

  child.on('exit', function(status) {

    console.log('child has exited', status)
  });
}