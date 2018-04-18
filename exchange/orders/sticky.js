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

    if(this.amount < this.data.market.minimalOrder.amount)
      throw new Error('Amount is too small');

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

    // note: currently always sticks to max BBO, does not overtake
    if(side === 'buy')
      this.price = Math.min(this.data.ticker.bid, this.limit);
    else
      this.price = Math.max(this.data.ticker.ask, this.limit);

    this.submit();

    return this;
  }

  submit() {
    this.api[this.side](this.amount, this.price, this.handleCreate);
  }

  handleCreate(err, id) {
    if(err)
      throw err;

    this.id = id;

    this.status = states.OPEN;
    this.emitStatus();

    if(this.cancelling)
      return this.cancel();

    this.timeout = setTimeout(this.checkOrder, this.checkInterval);
  }

  checkOrder() {
    this.api.checkOrder(this.id, (err, filled) => {
      // maybe we cancelled before the API call came back.
      if(this.cancelling || this.status === states.CANCELLED)
        return;

      if(err)
        throw err;

      if(filled)
        return this.filled(this.price);

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

      // update to new price
      this.price = price;
      this.submit();
    });
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