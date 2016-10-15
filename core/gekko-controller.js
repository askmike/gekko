// WIP:
// usage
// 
// in gekko dir:
//    node core/gekko-controller

var ForkTask = require('relieve').tasks.ForkTask
var fork = require('child_process').fork

task = new ForkTask(fork('./core/gekko-child.js'));

var mode = 'backtest';
var config = require('../config');

task.send('start', mode, config);

task.on('log', function(data) {
  console.log('CHILD LOG:', data);
});