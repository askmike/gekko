var _ = require('lodash');

var util = require('./util');
var dirs = util.dirs();
var log = require(dirs.core + 'log');

var EventLogger = function() {
  _.bindAll(this);
}

var subscriptions = require(dirs.core + 'subscriptions');
_.each(subscriptions, function(subscription) {
  EventLogger.prototype[subscription.handler] = function(e) {
    if(subscription.event === 'tick')
      log.empty();

    if(_.has(e, 'data'))
      log.debug(
        '\tnew event:',
        subscription.event,
        '(' + _.size(e.data),
        'items)'
      );
    else
      log.debug(
        '\tnew event:',
        subscription.event
      );
  }
});

module.exports = EventLogger;
