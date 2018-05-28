const moment = require('moment');
const util = require('../../core/util.js');
const _ = require('lodash');
const log = require('../../core/log');

var config = util.getConfig();
var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'bitx');

util.makeEventEmitter(Fetcher);

var end = false;
var from = false;
var next = false;
const REQUEST_INTERVAL = 15 * 1000;

Fetcher.prototype.getTrades = function(since, callback, descending) {
    let retryCritical = {
        retries: 10,
        factor: 1.25,
        minTimeout: REQUEST_INTERVAL,
        maxTimeout: REQUEST_INTERVAL * 10
    };

    let handleResponse = (callback) => {
        return (error, body) => {
            if (body && !_.isEmpty(body.code)) {
                error = new Error(`ERROR ${body.code}: ${body.msg}`);
            }
            if(error) log.error('ERROR:', error.message, 'Retrying...');
            return callback(error, body);
        }
    }

    let process = (err, result) => {
        if (err) {
            log.error('Error importing trades:', err);
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

    if(moment.isMoment(since)) since = since.valueOf();
    (_.isNumber(since) && since > 0) ? since : since = null;

    let handler = (cb) => this.bitx.getTrades({ since: since, pair: this.pair }, handleResponse(cb));
    util.retryCustom(retryCritical, _.bind(handler, this), _.bind(process, this));
}

var fetcher = new Fetcher(config.watch);

var fetch = () => {
    fetcher.import = true;
    setTimeout( () => fetcher.getTrades(from, handleFetch), REQUEST_INTERVAL);
};

var handleFetch = (err, trades) => {
    if (err) {
        log.error(`There was an error importing from BitX ${err}`);
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
        var endUnix = end.unix();
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
