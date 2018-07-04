const EventEmitter = require('events');
const _ = require('lodash');

const bindAll = require('../exchangeUtils').bindAll;
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

    // Check amount
    if(amount < this.data.market.minimalOrder.amount) {
      if(alreadyFilled) {
        // partially filled, but the remainder is too
        // small.
        return this.filled();
      }

      // We are not partially filled, meaning the
      // amount passed was too small to even start.
      throw new Error('Amount is too small');
    }

    // Some exchanges have restrictions on prices
    if(
      _.isFunction(this.api.isValidPrice) &&
      !this.api.isValidPrice(price)
    ) {
      if(alreadyFilled) {
        // partially filled, but the remainder is too
        // small.
        return this.filled();
      }

      // We are not partially filled, meaning the
      // amount passed was too small to even start.
      throw new Error('Price is not valid');
    }

    // Some exchanges have restrictions on lot sizes
    if(
      _.isFunction(this.api.isValidLot) &&
      !this.api.isValidLot(this.price, amount)
    ) {
      if(alreadyFilled) {
        // partially filled, but the remainder is too
        // small.
        return this.filled();
      }

      // We are not partially filled, meaning the
      // amount passed was too small to even start.
      throw new Error('Lot size is too small');
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
    this.completed = true;
    this.finish();
  }

  rejected(reason) {
    this.rejectedReason = reason;
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