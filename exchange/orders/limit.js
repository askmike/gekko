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

  roundLot(rawAmount, rawPrice) {
    const amount = this.api.roundAmount(rawAmount);

    if(amount < this.data.market.minimalOrder.amount)
      throw new Error('Amount is too small');

    const price = this.api.roundPrice(rawPrice);

    if(this.api.checkPrice)
      this.api.checkPrice(price);

    if(this.api.checkLot)
      this.api.checkLot({ price, amount });

    return { price, amount }
  }

  create(side, rawAmount, params) {
    
    const { price, amount } = this.roundLot(rawAmount, params.price);

    if(params.postOnly) {
      if(side === 'buy' && price > this.data.ticker.ask)
        throw new Error('Order crosses the book');
      else if(side === 'sell' && price < this.data.ticker.bid)
        throw new Error('Order crosses the book');
    }

    this.status = states.SUBMITTED;
    this.emitStatus();

    this.api[side](amount, price, this.handleCreate);

    this.price = price;
    this.amount = amount;
  }

  handleCreate(err, id) {
    if(err)
      throw err;

    this.status = states.OPEN;

    this.id = id;
    this.emitStatus();
    setTimeout(this.checkOrder, this.checkInterval)
  }

  checkOrder() {
    this.api.checkOrder(this.id, this.handleCheck);
  }

  handleCheck(err, filled) {
    if(err)
      throw err;

    if(!filled)
      return setTimeout(this.checkOrder, checkInterval);
  }

  cancel(next) {
    this.api.cancelOrder(this.id, (filled) => {

      if(filled)
        this.filled(this.price);

      next(filled);
    })
  }
 
}

module.exports = LimitOrder;