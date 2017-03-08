var _ = require('lodash');
var moment = require('moment');
var async = require('async');

var util = require('../../util');
var dirs = util.dirs();

var dateRangeScan = require('../dateRangeScan/parent');

module.exports = function(config, done) {

  util.setConfig(config);

  var adapter = config[config.adapter];
  var scan = require(dirs.gekko + adapter.path + '/scanner');

  scan((err, markets) => {

    if(err)
      return done(err);

    async.each(markets, (market, next) => {

      let marketConfig = _.clone(config);
      marketConfig.watch = market;

      dateRangeScan(marketConfig, (err, ranges) => {
        if(err)
          return next();

        market.ranges = ranges;

        next();
      });

    }, err => {
      let resp = {
        datasets: [],
        errors: []
      }
      markets.forEach(market => {
        if(market.ranges)
          resp.datasets.push(market);
        else
          resp.errors.push(market);
      })
      done(err, resp);
    })
  });
}