var Bitfinex = require("bitfinex-api-node");
var util = require('../../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../../core/log');

var config = util.getConfig();

var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'bitfinex');

util.makeEventEmitter(Fetcher);

var end = false;
var done = false;
var from = false;

var lastTimestamp = false;
var lastId = false;
var prevLastId = false;

var fetcher = new Fetcher(config.watch);

var fetch = () => {
    fetcher.import = true;

    if (lastTimestamp) {
        // We need to slow this down to prevent hitting the rate limits
        setTimeout(() => {
            fetcher.getTrades(lastTimestamp, handleFetch);
        }, 2000);
    }
    else {
        lastTimestamp = from.valueOf();
        fetcher.getTrades(from, handleFetch);   
    }
}

var handleFetch = (unk, trades) => {
    trades = _.filter(
        trades,
        t => t.tid > lastId
    );

    if (trades.length) {
        var last = moment.unix(_.last(trades).date);
        lastTimestamp = last.valueOf();
        lastId = _.last(trades).tid; 

        if(last < from) {
            log.debug('Skipping data, they are before from date', last.format());
            return fetch();
        }
    }
    else {
        lastTimestamp = moment(lastTimestamp).add(1, 'd').valueOf();
    }

    if  (moment(lastTimestamp) > end) {
        fetcher.emit('done');

        var endUnix = end.unix();
        trades = _.filter(
            trades,
            t => t.date <= endUnix
        );
    }

    prevLastId = lastId
    fetcher.emit('trades', trades);
}

module.exports = function (daterange) {

    from = daterange.from.clone();
    end = daterange.to.clone();

    return {
        bus: fetcher,
        fetch: fetch
    }
}


