const moment = require('moment');
const util = require('../../core/util.js');
const _ = require('lodash');
const retry = require('../../exchange/exchangeUtils').retry;

const config = util.getConfig();
const dirs = util.dirs();
const Fetcher = require(dirs.exchanges + 'luno');

util.makeEventEmitter(Fetcher);

var end = false;
var from = false;
const REQUEST_INTERVAL = 5 * 1000;

Fetcher.prototype.getTrades = function(since, callback, descending) {
  const recoverableErrors = [
    'SOCKETTIMEDOUT',
    'TIMEDOUT',
    'CONNRESET',
    'CONNREFUSED',
    'NOTFOUND'
  ];

  const processResponse = function(funcName, callback) {
    return (error, body) => {
      if (!error && !body) {
        error = new Error('Empty response');
      }

      if (error) {
        console.log(funcName, 'processResponse received ERROR:', error.message);
        if (includes(error.message, recoverableErrors)) {
          error.notFatal = true;
        }

        if (includes(error.message, ['error 429'])) {
          error.notFatal = true;
          error.backoffDelay = 10000;
        }

        return callback(error, undefined);
      }

      return callback(undefined, body);
    }
  };

  const process = (err, result) => {
    if (err) {
      console.log('Error importing trades:', err);
      return;
    }
    trades = _.map(result.trades, function(t) {
      return {
        price: t.price,
        date: Math.round(t.timestamp / 1000),
        amount: t.volume,
        tid: t.timestamp
      };
    });
    callback(null, trades.reverse());
  }

  if (moment.isMoment(since)) since = since.valueOf();
  (_.isNumber(since) && since > 0) ? since: since = 0;

  console.log('importer getting trades from Luno since', moment.utc(since).format('YYYY-MM-DD HH:mm:ss'), 'UTC');

  const handler = cb => this.luno.getTrades({ since: since, pair: this.pair }, processResponse('getTrades', cb));
  retry(null, handler, process);
}

const fetcher = new Fetcher(config.watch);

const fetch = () => {
  fetcher.import = true;
  setTimeout(() => fetcher.getTrades(from, handleFetch), REQUEST_INTERVAL);
};

const handleFetch = (err, trades) => {
  if (err) {
    console.log(`There was an error importing from Luno: ${err}`);
    fetcher.emit('done');
    return fetcher.emit('trades', []);
  }

  if (trades.length > 0) {
    from = moment.utc(_.last(trades).tid + 1).clone();
  } else {
    fetcher.emit('done');
  }

  if (from >= end) {
    fetcher.emit('done');
    const endUnix = end.unix();
    trades = _.filter(trades, t => t.date <= endUnix);
  }

  fetcher.emit('trades', trades);
};

module.exports = function(daterange) {
  from = daterange.from.clone().utc();
  end = daterange.to.clone().utc();

  return {
    bus: fetcher,
    fetch: fetch,
  };
};
