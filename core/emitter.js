// Gekko uses a custom event emitter within the GekkoStream (the plugins) to guarantee
// the correct order of events that are triggered by eachother. Turns sync events from
// LIFO into a FIFO stack based model.
//
// More details here: https://github.com/askmike/gekko/pull/1850#issuecomment-364842963 

const util = require('util');
const events = require('events');
const NativeEventEmitter = events.EventEmitter;

const GekkoEventEmitter = function() {
  NativeEventEmitter.call(this);
  this.defferedEvents = [];
}

util.inherits(GekkoEventEmitter, NativeEventEmitter);

// push to stack
GekkoEventEmitter.prototype.deferredEmit = function(name, payload) {
  this.defferedEvents.push({name, payload});
}

// resolve FIFO
GekkoEventEmitter.prototype.broadcastDeferredEmit = function() {
  if(this.defferedEvents.length === 0)
    return false;

  const event = this.defferedEvents.shift();

  this.emit(event.name, event.payload);
  return true;
}

module.exports = GekkoEventEmitter;