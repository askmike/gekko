var _ = require('lodash');
var util = require('./util');

module.exports = next => {

  var mode, config, done;

  console.log('tell me!');

  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', () => {
    var chunk = process.stdin.read();

    // handle input
    if (chunk !== null && !done) {
      
      // if(!mode) {

        console.log(chunk.trim());

        chunk = chunk.trim().split('\n');

        if(!_.contains(util.gekkoModes(), chunk[0]))
          util.die(`Mode "${chunk}" not supported.`);

        mode = chunk[0];

        console.log(chunk[1]);

        try {
          config = JSON.parse(chunk[1].trim());
        } catch(e) {
          util.die('Invalid config');
        }

        done = true;

        next(config, mode);
      } 

        
      // }

    // }
  });

  

}