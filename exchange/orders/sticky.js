/*
  The sticky order is an advanced order:
    - It is created at max price X
      - if max is not specified always at bbo.
      - if max is specified the price is either max or the bbo (whichever is comes first)
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

  create(side, rawAmount, params) {
    this.side = side;

    this.amount = this.api.roundAmount(rawAmount);

    if(this.amount < this.data.market.minimalOrder.amount)
      throw new Error('Amount is too small');

    this.status = states.SUBMITTED;
    this.emitStatus();

    // note: currently always sticks to BBO, does not overtake
    if(side === 'buy')
      this.price = this.data.ticker.bid;
    else
      this.price = this.data.ticker.ask;

    this.submit();  

    return this;
  }

  submit() {
    console.log('submit', this.price);
    this.api[this.side](this.amount, this.price, this.handleCreate);
  }

  handleCreate(err, id) {
    if(err)
      throw err;

    this.id = id;

    this.status = states.OPEN;
    this.emitStatus();

    setTimeout(this.checkOrder, this.checkInterval);
  }

  checkOrder() {
    this.api.checkOrder(this.id, (err, filled) => {
      if(err)
        throw err;

      if(filled)
        return this.filled(this.price);

      this.api.getTicker((err, ticker) => {
        let top;
        if(this.side === 'buy')
          top = ticker.bid;
        else
          top = ticker.ask;

        // note: might be string VS float
        if(top != this.price)
          return this.move(top);

        setTimeout(this.checkOrder, this.checkInterval);
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

      // update to new price
      this.price = price;

      this.submit();
    });
  }
 
}

module.exports = StickyOrder;