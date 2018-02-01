const log = require('../core/log');
const _ = require('lodash');
const subscriptions = require('../subscriptions');


var EventLogger = function() {}

_.each(subscriptions, sub => {
  EventLogger.prototype[sub.handler] = event => {
    log.info(`[EVENT ${sub.event}]`, event);
  }
})

module.exports = EventLogger;