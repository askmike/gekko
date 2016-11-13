var _ = require('lodash');
var moment = require('moment');
var async = require('async');

var util = require('../../util');
var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + 'log');

var adapter = config.adapters[config.backtest.adapter];
var scan = require(dirs.gekko + adapter.path + '/scanner');

var dateRangeScan = require('../dateRangeScan/parent');

module.exports = function(config, done) {
  scan((err, markets) => {
    if(err)
      return done(err);

    async.each(markets, (market, next) => {

      let marketConfig = _.clone(config);
      marketConfig.watch = market;

      dateRangeScan(marketConfig, (err, ranges) => {
        if(err)
          return next(err);

        market.ranges = ranges;

        next();
      });

    }, err => {
      done(err, markets);
    })
  });
}