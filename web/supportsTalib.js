var CAN_RUN_TALIB = true;

try {
  var talib = require('talib');
} catch(e) {
  CAN_RUN_TALIB = false;
}

console.log('TAlib is', CAN_RUN_TALIB ? 'enabled' : 'disabled');

module.exports = CAN_RUN_TALIB;