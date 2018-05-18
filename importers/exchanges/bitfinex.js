const Bitfinex = require('bitfinex-api-node');
const util = require('../../core/util.js');
const _ = require('lodash');
const moment = require('moment');
const log = require('../../core/log');

var config = util.getConfig();

var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'bitfinex');

Fetcher.prototype.getTrades = function(upto, callback, descending) {
  let process = (err, data) => {
    if (err) return callback(err);

    var trades = [];
    if (_.isArray(data)) {
      trades = _.map(data, function(trade) {
        return {
          tid: trade.ID,
          date: moment(trade.MTS).format('X'),
          price: +trade.PRICE,
          amount: +trade.AMOUNT,
        };
      });
    }

    callback(null, descending ? trades : trades.reverse());
  };

  let path = 'trades/t' + this.pair + '/hist';
  if (upto) {
    let start = moment(upto).subtract(1, 'd').valueOf();
    let end = moment(upto).valueOf();
    path += `?limit=1000&start=${start}&end=${end}`;
  }

  log.debug('Querying trades with: ' + path);
  let handler = cb => this.bitfinex.makePublicRequest(path, this.handleResponse('getTrades', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(process, this));
};

util.makeEventEmitter(Fetcher);

var end = false;
var done = false;
var from = false;

var lastTimestamp = false;
var lastId = false;

var batch = [];
var batch_start = false;
var batch_end = false;
var batch_last = false;

const SCANNING_STRIDE = 24;
const ITERATING_STRIDE = 2;
var stride = ITERATING_STRIDE;

var fetcher = new Fetcher(config.watch);
fetcher.bitfinex = new Bitfinex(null, null, { version: 2, transform: true }).rest;

var retryCritical = {
  retries: 10,
  factor: 1.2,
  minTimeout: 70 * 1000,
  maxTimeout: 120 * 1000,
};

var fetch = () => {
  fetcher.import = true;

  if (lastTimestamp) {
    // We need to slow this down to prevent hitting the rate limits
    setTimeout(() => {
      fetcher.getTrades(lastTimestamp, handleFetch);
    }, 2500);
  } else {
    lastTimestamp = from.valueOf();
    batch_start = moment(from);
    batch_end = moment(from).add(stride, 'h');
    fetcher.getTrades(batch_end, handleFetch);
  }
};

var handleFetch = (err, trades) => {
  if (err) {
    log.error(`There was an error importing from Bitfinex ${err}`);
    fetcher.emit('done');
    return fetcher.emit('trades', []);
  }

  trades = _.filter(trades, t => !lastId || t.tid < lastId);

  if (trades.length) {
    stride = ITERATING_STRIDE;
    batch = trades.concat(batch);
    var last = moment.unix(_.first(trades).date);
    lastTimestamp = last.valueOf();
    lastId = _.first(trades).tid;
  } else {
    stride = SCANNING_STRIDE;
    lastTimestamp = moment(lastTimestamp)
      .subtract(stride, 'h')
      .valueOf();
  }

  // if we're not done the batch we need to refetch
  if (trades.length && moment(lastTimestamp) >= batch_start) {
    return fetch();
  }

  var lastBatch = batch;

  // in this case we've finished the last batch and are complete
  if (batch_end.isSame(end)) {
    fetcher.emit('done');
  } else {
    // the batch if complete, lets advance to the next set
    lastId = false;
    batch = [];
    batch_start = moment(batch_end);
    batch_end = moment(batch_end).add(stride, 'h');

    if (batch_end > end) batch_end = moment(end);

    lastTimestamp = batch_end.valueOf();
  }

  fetcher.emit('trades', lastBatch);
};

module.exports = function(daterange) {
  from = daterange.from.clone();
  end = daterange.to.clone();

  return {
    bus: fetcher,
    fetch: fetch,
  };
};
