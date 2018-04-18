/*
  The sticky order is an advanced order:
    - It is created at max price X
      - if limit is not specified always at bbo.
      - if limit is specified the price is either limit or the bbo (whichever is comes first)
    - it will readjust the order:
      - if overtake is true it will overbid the current bbo <- TODO
      - if overtake is false it will stick to current bbo when this moves
    - If the price moves away from the order it will stay at the top


  TODO:
    - specify move behaviour (create new one first and cancel old order later?)
    - native move
    - if overtake is true it will overbid the current bbo
*/

const _ = require('lodash');
const async = require('async');
const events = require('events');
const moment = require('moment');
const errors = require('../exchangeErrors');
const BaseOrder = require('./order');
const states = require('./states');

class StickyOrder extends BaseOrder {
  constructor(api) {
    super(api);
  }

  create(side, rawAmount, params = {}) {
    this.side = side;

    this.amount = this.api.roundAmount(rawAmount);

    if(side === 'buy') {
      if(params.limit)
        this.limit = this.api.roundPrice(params.limit);
      else
        this.limit = Infinity;
    } else {
      if(params.limit)
        this.limit = this.api.roundPrice(params.limit);
      else
        this.limit = -Infinity;
    }

    this.status = states.SUBMITTED;
    this.emitStatus();

    this.orders = {};

    // note: currently always sticks to max BBO, does not overtake
    if(side === 'buy')
      this.price = Math.min(this.data.ticker.bid, this.limit);
    else
      this.price = Math.max(this.data.ticker.ask, this.limit);

    this.submit();

    return this;
  }

  submit() {
    const alreadyFilled = this.calculateFilled();
    const amount = this.amount - alreadyFilled;

    if(amount < this.data.market.minimalOrder.amount) {
      if(!alreadyFilled) {
        // We are not partially filled, meaning the
        // amount passed was too small to even start.
        throw new Error('Amount is too small');
      }

      // partially filled, but the remainder is too
      // small.
      return this.finish();
    }

    this.api[this.side](amount, this.price, this.handleCreate);
  }

  handleCreate(err, id) {
    if(err)
      throw err;

    // potentailly clean up old order
    if(
      this.id &&
      this.orders[this.id] &&
      !this.orders[this.id].filled
    )
      delete this.orders[this.id];

    this.id = id;
    this.orders[id] = {
      price: this.price,
      filled: 0
    }

    this.status = states.OPEN;
    this.emitStatus();

    if(this.cancelling)
      return this.cancel();

    if(this.movingLimit)
      return this.moveLimit();

    this.timeout = setTimeout(this.checkOrder, this.checkInterval);
  }

  checkOrder() {
    this.api.checkOrder(this.id, (err, result) => {
      // maybe we cancelled before the API call came back.
      if(this.cancelling || this.status === states.CANCELLED)
        return;

      if(err)
        throw err;

      if(result.open) {
        if(result.filledAmount !== this.filled) {
          this.orders[this.id].filled = result.filledAmount;

          // note: doc event API
          this.emit('partialFill', this.filled);
        }

        // if we are already at limit we dont care where the top is
        // note: might be string VS float
        if(this.price == this.limit)
          return setTimeout(this.checkOrder, this.checkInterval);

        this.api.getTicker((err, ticker) => {

          if(err)
            throw err;

          let top;
          if(this.side === 'buy')
            top = Math.min(ticker.bid, this.limit);
          else
            top = Math.max(ticker.ask, this.limit);

          // note: might be string VS float
          if(top != this.price)
            return this.move(top);

          this.timeout = setTimeout(this.checkOrder, this.checkInterval);
        });

        return;
      }

      if(!result.executed) {
        // not open and not executed means it never hit the book
        this.status = states.REJECTED;
        this.emitStatus();
        this.finish();
        return;
      }

      this.filled(this.price);

    });
  }

  move(price) {
    this.status = states.MOVING;
    this.emitStatus();

    this.api.cancelOrder(this.id, (err, filled) => {
      // it got filled before we could cancel
      if(filled)
        return this.filled(this.price);

      if(this.cancelling)
        return this.cancel();

      if(this.movingLimit)
        return this.moveLimit();

      // update to new price
      this.price = price;

      this.submit();
    });
  }

  calculateFilled() {
    let totalFilled = 0;
    _.each(this.orders, (order, id) => totalFilled += order.filled);

    return totalFilled;
  }

  moveLimit(limit) {

    if(!limit)
      limit = this.moveLimitTo;

    if(
      this.status === states.SUBMITTED ||
      this.status === states.MOVING
    ) {
      this.moveLimitTo = limit;
      this.movingLimit = true;
      return;
    }

    this.limit = this.api.roundPrice(limit);

    if(this.side === 'buy' && this.limit > this.price) {
      this.move(this.limit);
    } else if(this.side === 'sell' && this.limit < this.price) {
      this.move(this.limit);
    } else {
      this.timeout = setTimeout(this.checkOrder, this.checkInterval);
    }
  }

  cancel() {
    if(
      this.status === states.INITIALIZING ||
      this.status === states.COMPLETED ||
      this.status === states.CANCELLED ||
      this.status === states.REJECTED
    )
      return;

    if(
      this.status === states.SUBMITTED ||
      this.status === states.MOVING
    ) {
      this.cancelling = true;
      return;
    }

    clearTimeout(this.timeout);

    this.api.cancelOrder(this.id, filled => {

      this.cancelling = false;

      if(filled)
        return this.filled(this.price);

      this.status = states.CANCELLED;
      this.emitStatus();

      this.finish(false);
    })
  }
 
}

module.exports = StickyOrder;