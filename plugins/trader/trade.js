/*
  The Trade class is responsible for overseeing potentially multiple orders
  to execute a trade that completely moves a position.
  Discussion about this class can be found at: https://github.com/askmike/gekko/issues/1942
*/

var _ = require('lodash')
var util = require('../../core/util')
var dirs = util.dirs()
var events = require('events')
var log = require(dirs.core + 'log')
var async = require('async')
var checker = require(dirs.core + 'exchangeChecker.js')
var moment = require('moment')

class Trade{
  constructor(conf){
    this.conf = conf
    this.exchange = conf.exchange
    this.portfolio = conf.portfolio
    this.currency = conf.currency
    this.asset = conf.asset
    this.action = conf.action
    this.isActive = true
    this.isDeactivating = false
    this.orderIds = []

    this.exchangeMeta = checker.settings({exchange:this.exchange.name});

    this.marketConfig = _.find(this.exchangeMeta.markets, function(p) {
      return _.first(p.pair) === conf.currency.toUpperCase() && _.last(p.pair) === conf.asset.toUpperCase();
    });
    this.minimalOrder = this.marketConfig.minimalOrder;

    log.debug("created new Trade class to", this.action, this.asset + "/" + this.currency)

    if(_.isNumber(conf.keepAsset)) {
      log.debug('keep asset is active. will try to keep at least ' + conf.keepAsset + ' ' + conf.asset);
      this.keepAsset = conf.keepAsset;
    } else {
      this.keepAsset = 0;
    }

    this.doTrade()
  }

  deactivate(callback){
    this.isDeactivating = true

    log.debug("attempting to stop Trade class from", this.action + "ING", this.asset + "/" + this.currency)
    
    let done = () => {
      this.isActive = false
      log.debug("successfully stopped Trade class from", this.action + "ING", this.asset + "/" + this.currency)
      if(_.isFunction(callback))
        callback()
    }

    if(_.size(this.orderIds)){
      this.cancelLastOrder(done)
    } else {
      done()
    }
  }

  // This function makes sure the limit order gets submitted
  // to the exchange and initiates order registers watchers.
  doTrade(retry) {
    if(!this.isActive || this.isDeactivating)
      return false
    
    // if we are still busy executing the last trade
    // cancel that one (and ignore results = assume not filled)
    if(!retry && _.size(this.orderIds))
      return this.cancelLastOrder(() => this.doTrade());

    let act = () => {
      var amount, price;
      if(this.action === 'BUY') {
        amount = this.portfolio.getBalance(this.currency) / this.portfolio.ticker.ask;
        if(amount > 0){
            price = this.portfolio.ticker.bid;
            this.buy(amount, price);
        }
      } else if(this.action === 'SELL') {
        amount = this.portfolio.getBalance(this.asset) - this.keepAsset;
        if(amount > 0){
            price = this.portfolio.ticker.ask;
            this.sell(amount, price);
        }
      }
    }

    async.series([
      this.portfolio.setTicker.bind(this.portfolio),
      this.portfolio.setPortfolio.bind(this.portfolio),
      this.portfolio.setFee.bind(this.portfolio),
    ], act);
  }

  // first do a quick check to see whether we can buy
  // the asset, if so BUY and keep track of the order
  // (amount is in asset quantity)
  buy(amount, price) {
    let minimum = 0;

    let process = (err, order) => {
      if(!this.isActive || this.isDeactivating){
        return log.debug(this.action, "trade class is no longer active")
      }
      // if order to small
      if(!order.amount || order.amount < minimum) {
        return log.warn(
          'wanted to buy',
          this.asset,
          'but the amount is too small ',
          '(' + parseFloat(amount).toFixed(8) + ' @',
          parseFloat(price).toFixed(8),
          ') at',
          this.exchange.name
        );
      }

      log.info(
        'attempting to BUY',
        order.amount,
        this.asset,
        'at',
        this.exchange.name,
        'price:',
        order.price
      );

      this.exchange.buy(order.amount, order.price, _.bind(this.noteOrder,this) );
    }

    if (_.has(this.exchange, 'getLotSize')) {
      this.exchange.getLotSize('buy', amount, price, _.bind(process));
    } else {
      minimum = this.getMinimum(price);
      process(undefined, { amount: amount, price: price });
    }
  }

  // first do a quick check to see whether we can sell
  // the asset, if so SELL and keep track of the order
  // (amount is in asset quantity)
  sell(amount, price) {
    let minimum = 0;
    let process = (err, order) => {

      if(!this.isActive || this.isDeactivating){
        return log.debug(this.action, "trade class is no longer active")
      }

      // if order to small
      if (!order.amount || order.amount < minimum) {
        return log.warn(
          'wanted to buy',
          this.currency,
          'but the amount is too small ',
          '(' + parseFloat(amount).toFixed(8) + ' @',
          parseFloat(price).toFixed(8),
          ') at',
          this.exchange.name
        );
      }

      log.info(
        'attempting to SELL',
        order.amount,
        this.asset,
        'at',
        this.exchange.name,
        'price:',
        order.price
      );

      this.exchange.sell(order.amount, order.price, _.bind(this.noteOrder,this));
    }

    if (_.has(this.exchange, 'getLotSize')) {
      this.exchange.getLotSize('sell', amount, price, _.bind(process));
    } else {
      minimum = this.getMinimum(price);
      process(undefined, { amount: amount, price: price });
    }
  }


  // check whether the order got fully filled
  // if it is not: cancel & instantiate a new order
  checkOrder() {
    var handleCheckResult = function(err, filled) {

      if(this.isDeactivating){
        return log.debug("trade : checkOrder() : ", this.action, "trade class is currently deactivating, stop check order")
      }

      if(!this.isActive){
        return log.debug("trade : checkOrder() : ", this.action, "trade class is no longer active, stop check order")
      }

      if(!filled) {
        log.info(this.action, 'order was not (fully) filled, cancelling and creating new order');
        log.debug("trade : checkOrder() : cancelling last " + this.action + " order ID : ", _.last(this.orderIds))
        this.exchange.cancelOrder(_.last(this.orderIds), _.bind(handleCancelResult, this));
        return;
      }

      log.info("trade was successful", this.action + "ING", this.asset + "/" + this.currency)
      this.isActive = false;

      this.relayOrder();
    }

    var handleCancelResult = function(alreadyFilled) {
      if(alreadyFilled)
        return;

      if(this.exchangeMeta.forceReorderDelay) {
          //We need to wait in case a canceled order has already reduced the amount
          var wait = 10;
          log.debug(`Waiting ${wait} seconds before starting a new trade on ${this.exchangeMeta.name}!`);

          setTimeout(
              () => this.doTrade(true),
              +moment.duration(wait, 'seconds')
          );
          return;
      }

      this.doTrade(true);
    }

    this.exchange.checkOrder(_.last(this.orderIds), _.bind(handleCheckResult, this));
  }

  cancelLastOrder(done) {
    log.debug("trade : cancelLastOrder() : cancelling last " + this.action + " order ID : ", _.last(this.orderIds))
    this.exchange.cancelOrder(_.last(this.orderIds), alreadyFilled => {
      if(alreadyFilled)
        return this.relayOrder(done);
      done();
    });

  }

  noteOrder(err, order) {
    if(err) {
      util.die(err);
    }

    this.orderIds.push(order);

    // If unfilled, cancel and replace order with adjusted price
    let cancelDelay = this.conf.orderUpdateDelay || 1;
    setTimeout(_.bind(this.checkOrder,this), util.minToMs(cancelDelay));
  }

  relayOrder(done) {
    // look up all executed orders and relay average.
    let relay = (err, res) => {

      var price = 0;
      var amount = 0;
      var date = moment(0);

      _.each(res.filter(o => !_.isUndefined(o) && o.amount), order => {
        date = _.max([moment(order.date), date]);
        price = ((price * amount) + (order.price * order.amount)) / (order.amount + amount);
        amount += +order.amount;
      });

      async.series([
        this.portfolio.setTicker.bind(this.portfolio),
        this.portfolio.setPortfolio.bind(this.portfolio)
      ], () => {
        const portfolio = this.portfolio.convertPortfolio(this.asset,this.currency);

        this.emit('trade', {
          date,
          price,
          portfolio: portfolio,
          balance: portfolio.balance,

          // NOTE: within the portfolioManager
          // this is in uppercase, everywhere else
          // (UI, performanceAnalyzer, etc. it is
          // lowercase)
          action: this.action.toLowerCase()
        });

        if(_.isFunction(done))
          done();
      });

    }

    var getOrders = _.map(
      this.orderIds,
      order => next => this.exchange.getOrder(order, next)
    );

    async.series(getOrders, relay);
  }

  getMinimum(price) {
    if(this.minimalOrder.unit === 'currency')
      return minimum = this.minimalOrder.amount / price;
    else
      return minimum = this.minimalOrder.amount;
  }
}

util.makeEventEmitter(Trade)

module.exports = Trade