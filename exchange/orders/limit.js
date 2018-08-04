// NOTE: this is currently broken, see
// @link https://github.com/askmike/gekko/issues/2398

throw ':(';

/*
  The limit order is a simple order:
    - It is created at the specified price
    - If it were to cross it will throw instead (only if postOnly is specified)
    - It can be moved

*/

const _ = require('lodash');
const async = require('async');
const events = require('events');
const moment = require('moment');
const errors = require('../exchangeErrors');
const BaseOrder = require('./order');
const states = require('./states');

class LimitOrder extends BaseOrder {
  constructor(api) {
    super(api);
  }

  create(side, amount, params) {
    this.side = side;

    this.postOnly = params.postOnly;

    this.status = states.SUBMITTED;
    this.emitStatus();

    this.createOrder(price, amount);
  }

  createOrder(price, amount) {
    this.amount = this.api.roundAmount(amount);
    this.price = this.api.roundPrice(price);

    // note: this assumes ticker data to be up to date
    if(this.postOnly) {
      if(side === 'buy' && this.price > this.data.ticker.ask)
        throw new Error('Order crosses the book');
      else if(side === 'sell' && this.price < this.data.ticker.bid)
        throw new Error('Order crosses the book');
    }

    this.submit({
      side: this.side,
      amount: this.api.roundAmount(this.amount - alreadyFilled),
      price: this.price,
      alreadyFilled: this.filled
    });
  }

  handleCreate(err, id) {
    if(err)
      throw err;

    this.status = states.OPEN;
    this.emitStatus();

    this.id = id;

    if(this.cancelling)
      return this.cancel();

    if(this.movingAmount)
      return this.moveAmount();

    if(this.movingPrice)
      return this.movePrice();

    this.timeout = setTimeout(this.checkOrder, this.checkInterval)
  }

  checkOrder() {
    this.checking = true;
    this.api.checkOrder(this.id, this.handleCheck);
  }

  handleCheck(err, result) {
    if(this.cancelling || this.status === states.CANCELLED)
      return;

    this.checking = false;

    if(err)
      throw err;

    if(result.open) {
      if(result.filledAmount !== this.filledAmount) {
        this.filledAmount = result.filledAmount;

        // note: doc event API
        this.emit('fill', this.filledAmount);
      }

      if(this.cancelling)
        return this.cancel();

      if(this.movingAmount)
        return this.moveAmount();

      if(this.movingPrice)
        return this.movePrice();

      this.timeout = setTimeout(this.checkOrder, this.checkInterval);
      return;
    }

    if(!result.executed) {
      // not open and not executed means it never hit the book
      this.rejected();
      return;
    }

    this.filled(this.price);
  }

  movePrice(price) {
    if(this.completed)
      return;

    if(!price)
      price = this.movePriceTo;

    if(this.price === this.api.roundPrice(price))
      // effectively nothing changed
      return;

    if(
      this.status === states.SUBMITTED ||
      this.status === states.MOVING ||
      this.checking
    ) {
      this.movePriceTo = price;
      this.movingPrice = true;
      return;
    }

    this.movingPrice = false;

    this.price = this.api.roundPrice(price);

    clearTimeout(this.timeout);

    this.status = states.MOVING;

    this.api.cancelOrder(this.id, (err, filled) => {
      if(err)
        throw err;

      if(filled)
        return this.filled(this.price);

      this.submit({
        side: this.side,
        amount: this.amount,
        price: this.price,
        alreadyFilled: this.filled
      });
    });
  }

  moveAmount(amount) {
    if(this.completed)
      return;

    if(!amount)
      amount = this.moveAmountTo;

    if(this.amount === this.api.roundAmount(amount))
      // effectively nothing changed
      return;

    if(
      this.status === states.SUBMITTED ||
      this.status === states.MOVING ||
      this.checking
    ) {
      this.moveAmountTo = amount;
      this.movingAmount = true;
      return;
    }

    this.movingAmount = false;
    this.amount = this.api.roundAmount(amount);

    clearTimeout(this.timeout);

    this.status = states.MOVING;
    this.emitStatus();

    this.api.cancelOrder(this.id, (err, filled) => {
      if(err)
        throw err;

      if(filled)
        return this.filled(this.price);

      this.submit({
        side: this.side,
        amount: this.amount,
        price: this.price,
        alreadyFilled: this.filled
      });
    });
  }

  cancel() {
    if(this.completed)
      return;

    if(
      this.status === states.SUBMITTED ||
      this.status === states.MOVING ||
      this.checking
    ) {
      this.cancelling = true;
      return;
    }

    clearTimeout(this.timeout);

    this.api.cancelOrder(this.id, (err, filled) => {
      if(err)
        throw err;

      this.cancelling = false;

      if(filled)
        return this.filled(this.price);

      this.status = states.CANCELLED;
      this.emitStatus();
      this.finish(false);
    });
  }
}

module.exports = LimitOrder;