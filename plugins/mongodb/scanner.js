const async = require('async');
var _ = require('lodash');
var util = require('../../core/util.js');
var log = require(`${util.dirs().core}log`);

var handle = require('./handle');

module.exports = done => {
    this.db = handle;

    let markets = [];
    async.waterfall([
        (cb) => {
            handle.getCollectionNames(cb)
        },
        (collections, cb) => {
            async.each(collections, (collection, cb) => {
                let [exchange, type] = collection.split('_');
                if (type === 'candles') {
                    handle.collection(collection).distinct('pair', {}, (err, pairs) => {
                        console.log(exchange);
                        pairs.forEach((pair) => {
                            pair = pair.split('_');
                            markets.push({
                                exchange: exchange,
                                currency: _.first(pair),
                                asset: _.last(pair)
                            });
                        });
                        cb();
                    })
                } else {
                    cb();
                }
            }, () => {
                cb(null, markets)
            })
        }
    ], done)
}