const Gdax = require('gdax');
const util = require('../../core/util.js');
const _ = require('lodash');
const moment = require('moment');
const log = require('../../core/log');

const config = util.getConfig();

const dirs = util.dirs();

const QUERY_DELAY = 350;
const BATCH_SIZE = 100;
const SCAN_ITER_SIZE = 50000;
const BATCH_ITER_SIZE = BATCH_SIZE * 10;

let Fetcher = require(dirs.exchanges + 'gdax');

Fetcher.prototype.getTrades = function(sinceTid, callback) {
  let lastScan = 0;

  let process = function(err, data) {
    if (err) return callback(err);

    let result = _.map(data, function(trade) {
      return {
        tid: trade.trade_id,
        amount: parseFloat(trade.size),
        date: moment.utc(trade.time).format("X"),
        price: parseFloat(trade.price)
      };
    });

    callback(null, result.reverse());
  };

  let handler = (cb) => this.gdax_public.getProductTrades({ after: sinceTid, limit: BATCH_SIZE }, this.handleResponse('getTrades', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(process, this));
};

Fetcher.prototype.findFirstTrade = function(sinceTs, callback) {
  let currentId = 0;
  let sinceM = moment(sinceTs).utc();

  log.info(`Scanning for the first trade ID to start batching requests, may take a few minutes ...`);

  let process = function(err, data) {
    if (err) return callback(err);

    let m = moment.utc(_.first(data).time);
    let ts = m.valueOf();
    if (ts < sinceTs) {
      log.info(`First trade ID for batching found ${currentId - SCAN_ITER_SIZE}`);
      return callback(undefined, currentId - SCAN_ITER_SIZE);
    }

    currentId = _.first(data).trade_id;
    log.debug(`Have trade id ${currentId} for date ${_.first(data).time} ${sinceM.from(m, true)} to scan`);

    let nextScanId = currentId - SCAN_ITER_SIZE;
    if (nextScanId <= SCAN_ITER_SIZE) {
      currentId = BATCH_ITER_SIZE;
      log.info(`First trade ID for batching found ${currentId}`);
      return callback(undefined, currentId);
    }

    setTimeout(() => {
      let handler = (cb) => this.gdax_public.getProductTrades({ after: nextScanId, limit: 1 }, this.handleResponse('getTrades', cb));
      util.retryCustom(retryForever, _.bind(handler, this), _.bind(process, this));
    }, QUERY_DELAY);
  }

  let handler = (cb) => this.gdax_public.getProductTrades({ limit: 1 }, this.handleResponse('getTrades', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(process, this));
}

util.makeEventEmitter(Fetcher);

let end = false;
let done = false;
let from = false;

let batch = [];
let batchId = false; // Lowest ID for the current a batch

let lastId = false;

let latestId = false;
let latestMoment = false;

let fetcher = new Fetcher(config.watch);

let retryForever = {
  forever: true,
  factor: 1.2,
  minTimeout: 10 * 1000,
  maxTimeout: 120 * 1000
};

let fetch = () => {
  fetcher.import = true;

  // We are in the sub-iteration step for a given batch
  if (lastId) {
    setTimeout(() => {
      fetcher.getTrades(lastId, handleFetch);
    }, QUERY_DELAY);
  }
  // We are running the first query, and need to find the starting batch
  else {
    let process = (err, firstBatchId) => {
      if (err) return handleFetch(err);

      batchId = firstBatchId;
      fetcher.getTrades(batchId + 1, handleFetch);
    }
    fetcher.findFirstTrade(from.valueOf(), process);
  }
}

let handleFetch = (err, trades) => {
  if (err) {
    log.error(`There was an error importing from GDAX ${err}`);
    fetcher.emit('done');
    return fetcher.emit('trades', []);
  }

  if (trades.length) {
    batch = trades.concat(batch);

    let last = moment.unix(_.first(trades).date).utc();
    lastId = _.first(trades).tid

    let latestTrade = _.last(trades);
    if (!latestId || latestTrade.tid > latestId) {
      latestId = latestTrade.tid;
      latestMoment = moment.unix(latestTrade.date).utc();
    }

    // still doing sub-iteration in the batch
    if (lastId >= (batchId - BATCH_ITER_SIZE) && last >= from)
      return fetch();
  }

  batchId += BATCH_ITER_SIZE;
  lastId = batchId + 1;

  if (latestMoment >= end) {
    fetcher.emit('done');
  }

  let endUnix = end.unix();
  let startUnix = from.unix();
  batch = _.filter(batch, t => t.date >= startUnix && t.date <= endUnix);

  fetcher.emit('trades', batch);
  batch = [];
}

module.exports = function (daterange) {

  from = daterange.from.utc().clone();
  end = daterange.to.utc().clone();

  return {
    bus: fetcher,
    fetch: fetch
  }
}
