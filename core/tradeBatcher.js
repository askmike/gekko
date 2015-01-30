// 
// Small wrapper that only propogates new trades.
// 
// Expects trade batches to be written like:
// [
//  {
//    tid: x, // tid is preferred, but if none available date will also work
//    price: x,
//    date: (timestamp),
//    amount: x
//  },
//  {
//    tid: x + 1,
//    price: x,
//    date: (timestamp),
//    amount: x
//  }
// ]
// 
// Emits 'new trades' event with:
// {
//   amount: x,
//   start: (moment),
//   end: (moment),
//   first: (trade),
//   last: (trade),
//   timespan: x,
//   data: [
//      // batch of new trades with 
//      // moments instead of timestamps
//   ]
// }

var _ = require('lodash');
var moment = require('moment');
var util = require('./util');
var log = require('./log');

var TradeBatcher = function(tid) {
  _.bindAll(this);
  this.tid = tid;
  this.last = -1;
}

util.makeEventEmitter(TradeBatcher);

TradeBatcher.prototype.write = function(batch) {
  if(_.isEmpty(batch))
    return log.debug('Trade fetch came back empty.');

  if(!_.isArray(batch))
    batch = [batch];

  batch = this.filter(batch);

  var amount = _.size(batch);
  if(!amount)
    return log.debug('No new trades.');

  batch = this.convertDates(batch);

  var last = _.last(batch);
  var first = _.first(batch);

  log.debug('Processing', amount, 'new trades.');
  log.debug(
    'From',
    first.date.format('YYYY-MM-DD HH:mm:ss'),
    'UTC to',
    last.date.format('YYYY-MM-DD HH:mm:ss'),
    'UTC.',
    '(' + first.date.from(last.date, true) + ')'
  );

  this.emit('new batch', {
    amount: amount,
    start: first.date,
    end: last.date,
    last: last,
    first: first,
    data: batch
  });

  this.last = last.tid;
}

TradeBatcher.prototype.filter = function(batch) {
  // make sure we're not trying to count
  // beyond infinity
  var lastTid = _.last(batch)[this.tid];
  if(lastTid === lastTid + 1)
    util.die('trade tid is max int, Gekko can\'t process..');

  // weed out known trades
  // TODO: optimize by stopping as soon as the
  // first trade is too old (reverse first)
  return _.filter(batch, function(trade) {
    return this.last < trade[this.tid];
  }, this);
}

TradeBatcher.prototype.convertDates = function(batch) {
  return _.map(batch, function(trade) {
    trade.date = moment.unix(trade.date).utc();
    return trade;
  });
}

module.exports = TradeBatcher;
