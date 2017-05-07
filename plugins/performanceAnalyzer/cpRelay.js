// relay paper trade results using cp

const _ = require('lodash');
const moment = require('moment');

const util = require('../../core/util.js');
const dirs = util.dirs();
const mode = util.gekkoMode();
const log = require(dirs.core + 'log');
const cp = require(dirs.core + 'cp');

const Relay = function() {}

Relay.prototype.handleTrade = function(trade, report) {
  cp.trade(trade);
  cp.report(report);
}

Relay.prototype.handleRoundtrip = function(rt) {
  cp.roundtrip(rt);
}

Relay.prototype.finalize = function(report) {
  cp.report(report);
}


module.exports = Relay;