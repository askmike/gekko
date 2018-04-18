const EventEmitter = require('events');

const bindAll = require('../exchangeUtils').bindAll;
const states = require('./states');

// base order

class BaseOrder extends EventEmitter {
  constructor(api) {
    super();

    this.api = api;

    this.checkInterval = 1000;

    this.status = states.INITIALIZING;
    this.emitStatus();

    bindAll(this);
  }

  setData(data) {
    this.data = data;
  }

  emitStatus() {
    this.emit('statusChange', this.status);
  }

  filled(price) {
    this.status = states.FILLED;
    this.emitStatus();

    this.status = states.COMPLETED;
    this.emitStatus();

    this.emit('filled', {
      id: this.id,
      price,
      amount: this.amount
    });

    this.finish(true);
  }

  finish(filled) {
    this.emit('completed', {
      id: this.id,
      filled
    })
  }
}

module.exports = BaseOrder;