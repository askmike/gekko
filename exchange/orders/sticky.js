/*
  The sticky order is an advanced order:
    - It is created at max price X
      - if limit is not specified always at bbo.
      - if limit is specified the price is either limit or the bbo (whichever is comes first)
    - it will readjust the order:
      - if overtake is true it will overbid the current bbo <- TODO
      - if overtake is false it will stick to current bbo when this moves
    - If the price moves away from the order it will "stick to" the top

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

    // global async lock
    this.sticking = false;
  }

  createSummary(next) {
    if(!this.completed)
      console.log(new Date, 'createSummary BUT ORDER NOT COMPLETED!');

    if(!next)
      next = _.noop;

    const checkOrders = _.keys(this.orders)
      .map(id => next => {

        if(!this.orders[id].filled) {
          return next();
        }

        setTimeout(() => this.api.getOrder(id, next), this.timeout);
      });

    async.series(checkOrders, (err, trades) => {
      if(err) {
        return next(err);
      }

      let price = 0;
      let amount = 0;
      let date = moment(0);

      _.each(trades, trade => {
        // last fill counts
        date = moment(trade.date);
        price = ((price * amount) + (+trade.price * trade.amount)) / (+trade.amount + amount);
        amount += +trade.amount;
      });

      const summary = {
        price,
        amount,
        date,
        side: this.side,
        orders: trades.length
      }

      if(_.first(trades) && _.first(trades).fees) {
        _.each(trades, trade => {
          summary.fees = {};
          _.each(trade.fees, (amount, currency) => {
            if(!_.isNumber(summary.fees[currency])) {
              summary.fees[currency] = amount;
            } else {
              summary.fees[currency] += amount;
            }
          });
        });
      }

      this.emit('summary', summary);
      next(undefined, summary);
    });
  }

  create(side, rawAmount, params = {}) {
    if(this.completed || this.completing) {
      return false;
    }

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

    this.createOrder();

    return this;
  }

  createOrder() {
    if(this.completed || this.completing) {
      return false;
    }

    const alreadyFilled = this.calculateFilled();

    // console.log(new Date, `creating [${this.api.name}] ${this.side} ${this.api.roundAmount(this.amount - alreadyFilled)} at ${this.price}`);
    this.submit({
      side: this.side,
      amount: this.api.roundAmount(this.amount - alreadyFilled),
      price: this.price,
      alreadyFilled
    });
  }

  handleCreate(err, id) {
    if(err) {
      console.log('handleCreate', err.message);
      throw err;
    }

    if(!id)
      console.log('BLUP! no id...');

    // potentailly clean up old order
    if(
      this.id &&
      this.orders[this.id] &&
      this.orders[this.id].filled === 0
    )
      delete this.orders[this.id];

    // register new order
    this.id = id;
    this.orders[id] = {
      price: this.price,
      filled: 0
    }

    this.emit('new order', this.id);

    this.status = states.OPEN;
    this.emitStatus();

    // remove lock
    this.sticking = false;

    // check whether we had an action pending
    if(this.cancelling)
      return this.cancel();

    if(this.movingLimit)
      return this.moveLimit();

    if(this.movingAmount)
      return this.moveAmount();

    // register check
    this.timeout = setTimeout(this.checkOrder, this.checkInterval);
  }

  checkOrder() {
    if(this.completed || this.completing) {
      return console.log(new Date, 'checkOrder called on completed/completing order..', this.completed, this.completing);
    }

    this.sticking = true;

    this.api.checkOrder(this.id, (err, result) => {
      if(err) {
        console.log(new Date, 'error creating:', err.message);
        throw err;
      }

      if(result.open) {
        if(result.filledAmount !== this.orders[this.id].filled) {
          this.orders[this.id].filled = result.filledAmount;
          this.emit('fill', this.calculateFilled());
        }

        // if we are already at limit we dont care where the top is
        // note: might be string VS float
        if(this.price == this.limit) {
          this.timeout = setTimeout(this.checkOrder, this.checkInterval);
          this.sticking = false;
          return;
        }

        this.api.getTicker((err, ticker) => {
          if(err)
            throw err;

          this.ticker = ticker;

          let top;
          if(this.side === 'buy')
            top = Math.min(ticker.bid, this.limit);
          else
            top = Math.max(ticker.ask, this.limit);

          // note: might be string VS float
          if(top != this.price)
            return this.move(top);

          this.timeout = setTimeout(this.checkOrder, this.checkInterval);
          this.sticking = false;
        });

        return;
      }

      if(!result.executed) {
        // not open and not executed means it never hit the book
        this.sticking = false;
        this.status = states.REJECTED;
        this.emitStatus();
        this.finish();
        return;
      }

      // order got filled!
      this.orders[this.id].filled = this.amount;
      this.sticking = false;
      this.emit('fill', this.amount);
      this.filled(this.price);

    });
  }

  move(price) {
    if(this.completed || this.completing) {
      return false;
    }

    this.status = states.MOVING;
    this.emitStatus();

    this.api.cancelOrder(this.id, (err, filled) => {
      // it got filled before we could cancel
      if(filled) {
        this.orders[this.id].filled = this.amount;
        this.emit('fill', this.amount);
        return this.filled(this.price);
      }

      // update to new price
      this.price = this.api.roundPrice(price);

      this.createOrder();
    });

    return true;
  }

  calculateFilled() {
    let totalFilled = 0;
    _.each(this.orders, (order, id) => totalFilled += order.filled);

    return totalFilled;
  }

  moveLimit(limit) {
    if(this.completed || this.completing) {
      return false;
    }

    if(!limit) {
      limit = this.moveLimitTo;
    }

    if(this.limit === this.api.roundPrice(limit))
      // effectively nothing changed
      return false;

    if(
      this.status === states.INITIALIZING ||
      this.status === states.SUBMITTED ||
      this.status === states.MOVING ||
      this.sticking
    ) {
      this.moveLimitTo = limit;
      this.movingLimit = true;
      return;
    }

    this.limit = this.api.roundPrice(limit);

    clearTimeout(this.timeout);

    this.movingLimit = false;

    if(this.side === 'buy' && this.limit < this.price) {
      this.sticking = true;
      this.move(this.limit);
    } else if(this.side === 'sell' && this.limit > this.price) {
      this.sticking = true;
      this.move(this.limit);
    } else {
      this.timeout = setTimeout(this.checkOrder, this.checkInterval);
    }

    return true;
  }

  moveAmount(amount) {
    if(this.completed || this.completing)
      return false;

    if(!amount)
      amount = this.moveAmountTo;

    if(this.amount === this.api.roundAmount(amount))
      // effectively nothing changed
      return true;

    if(this.calculateFilled() > this.api.roundAmount(amount)) {
      // the amount is now below how much we have
      // already filled.
      this.filled();
      return false;
    }

    if(
      this.status === states.INITIALIZING ||
      this.status === states.SUBMITTED ||
      this.status === states.MOVING ||
      this.sticking
    ) {
      this.moveAmountTo = amount;
      this.movingAmount = true;
      return;
    }

    this.amount = this.api.roundAmount(amount - this.calculateFilled());

    if(this.amount < this.data.market.minimalOrder.amount) {
      if(this.calculateFilled()) {
        // we already filled enough of the order!
        this.filled();
        return false;
      } else {
        throw new Error("The amount " + this.amount + " is too small.");
      }
    }

    clearTimeout(this.timeout);

    this.movingAmount = false;
    this.sticking = true;

    this.api.cancelOrder(this.id, filled => {

      if(filled) {
        this.emit('fill', this.amount);
        return this.filled(this.price);
      }

      this.createOrder();
    });

    return true;
  }

  cancel() {
    if(this.completed)
      return;

    if(
      this.status === states.SUBMITTED ||
      this.status === states.MOVING ||
      this.sticking
    ) {
      this.cancelling = true;
      return;
    }

    this.completing = true;
    clearTimeout(this.timeout);
    this.api.cancelOrder(this.id, (err, filled) => {
      if(err) {
        throw err;
      }

      this.cancelling = false;

      if(filled) {
        this.orders[this.id].filled = this.amount;
        this.emit('fill', this.amount);
        return this.filled(this.price);
      }

      this.status = states.CANCELLED;
      this.emitStatus();

      this.finish(false);
    })
  }
 
}

module.exports = StickyOrder;