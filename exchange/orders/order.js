const EventEmitter = require('events');
const _ = require('lodash');

const exchangeUtils = require('../exchangeUtils');
const bindAll = exchangeUtils.bindAll;
const isValidOrder = exchangeUtils.isValidOrder;
const states = require('./states');

// base order

class BaseOrder extends EventEmitter {
  constructor(api) {
    super();

    this.api = api;

    this.checkInterval = api.interval || 1500;

    this.status = states.INITIALIZING;

    this.completed = false;
    this.completing = false;

    bindAll(this);
  }

  submit({side, amount, price, alreadyFilled}) {
    const check = isValidOrder({
      market: this.market,
      api: this.api,
      amount,
      price
    });

    if(!check.valid) {
      if(alreadyFilled) {
        // partially filled, but the remainder is too
        // small.
        return this.filled();
      }

      this.emit('invalidOrder', check.reason);
      this.rejected(check.reason);
    }

    this.api[this.side](amount, this.price, this.handleCreate);
  }

  setData(data) {
    this.data = data;
  }

  emitStatus() {
    this.emit('statusChange', this.status);
  }

  cancelled() {
    this.status = states.CANCELLED;
    this.emitStatus();
    this.completed = true;
    this.finish();
  }

  rejected(reason) {
    this.rejectedReason = reason;
    this.emitStatus();
    this.status = states.REJECTED;
    this.finish();
  }

  filled(price) {
    this.status = states.FILLED;
    this.emitStatus();

    this.completed = true;

    this.finish(true);
  }

  finish(filled) {
    this.completed = true;
    this.emit('completed', {
      status: this.status,
      filled
    })
  }
}

module.exports = BaseOrder;