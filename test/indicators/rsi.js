var chai = require('chai');
var expect = chai.expect;
var should = chai.should;
var sinon = require('sinon');

var _ = require('lodash');

var util = require('../../core/util');
var dirs = util.dirs();
var INDICATOR_PATH = dirs.indicators;

// Fake input prices to verify all indicators 
// are working correctly by comparing fresh
// calculated results to pre calculated results.

// The precalculated results are compared to the Talib repository at
// https://github.com/wuhkuh/talib
// (shameless plug, sorry guys ;))

var prices = [81, 24, 75, 21, 34, 25, 72, 92, 99, 2, 86, 80, 76, 8, 87, 75, 32, 65, 41, 9, 13, 26, 56, 28, 65, 58, 17, 90, 87, 86, 99, 3, 70, 1, 27, 9, 92, 68, 9];

describe('indicators/RSI', function() {

  var RSI = require(INDICATOR_PATH + 'RSI');

  var verified_rsi2results = [0, 0, 47.22222222222223, 23.611111111111114, 38.43283582089553, 30.294117647058826, 78.2967032967033, 86.31639722863741, 89.12844036697248, 13.311866264730071, 64.95013850415512, 59.85653017461453, 54.19016363132106, 12.8454188854557, 68.56748255340673, 57.41553886370404, 26.512530826658676, 59.75774345724092, 36.04149739852744, 17.51008036340795, 26.905774699598737, 58.00044863973779, 85.82728624443239, 38.371227493966536, 74.96090570884536, 61.21019495608749, 19.438903652597787, 76.51344601664712, 72.30324117451528, 69.74473974944168, 84.24228523539779, 10.429850167468388, 59.707866801087974, 27.99023519523047, 48.57675474701421, 34.80106793288934, 81.96579567492182, 57.78953245436237, 23.585658801479056];
  var verified_rsi12results = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49.44320712694878, 42.432667245873155, 51.2017782300719, 49.94116787991835, 45.55663590860508, 49.284333951746184, 46.74501674557244, 43.4860123510052, 44.01823674189631, 45.82704797004994, 49.90209564896179, 46.351969981868436, 51.34208640997234, 50.37501845071388, 44.96351306736635, 54.464714123844956, 54.04642006918241, 53.895901697369816, 55.6476477612053, 42.60631369413207, 51.2964732419777, 43.83906729252931, 47.00600661743475, 45.08586375053323, 54.44633399991266, 51.6681674437389, 45.44886082103851];
  var verified_rsi26results = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46.44444444444444, 50.61070579555701, 50.44298978067838, 50.385107396174675, 51.143071170125296, 45.77270174725033, 49.6130641968312, 46.115177339098764, 47.56394036014283, 46.660676933508505, 51.11283316502063, 49.861270146262456, 46.92369439491447];

  it('should correctly calculate RSI with period 2', function() {
    var rsi = new RSI({ interval: 2 });
    _.each(prices, function(p, i) {
      rsi.update({ close: p });
      expect(rsi.rsi).to.equal(verified_rsi2results[i]);
    });
  });

  it('should correctly calculate RSI with period 12', function() {
    var rsi = new RSI({ interval: 12 });
    _.each(prices, function(p, i) {
      rsi.update({ close: p });
      expect(rsi.rsi).to.equal(verified_rsi12results[i]);
    });
  });

  it('should correctly calculate RSI with period 26', function() {
    var rsi = new RSI({ interval: 26 });
    _.each(prices, function(p, i) {
      rsi.update({ close: p });
      expect(rsi.rsi).to.equal(verified_rsi26results[i]);
    });
  });
});
