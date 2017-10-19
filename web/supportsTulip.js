var CAN_RUN_TULIP = true;

try {
  var tulind = require('tulind');
} catch(e) {
  CAN_RUN_TULIP = false;
}

console.log('TULIP indicators is', CAN_RUN_TULIP ? 'enabled' : 'disabled');

module.exports = CAN_RUN_TULIP;