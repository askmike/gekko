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

describe('indicators/SMMA', function() {

  var SMMA = require(INDICATOR_PATH + 'SMMA');

  var verified_smma2results = [0, 52.5, 63.75, 42.375, 38.1875, 31.59375, 51.796875, 71.8984375, 85.44921875, 43.724609375, 64.8623046875, 72.43115234375, 74.215576171875, 41.1077880859375, 64.05389404296875, 69.52694702148438, 50.76347351074219, 57.881736755371094, 49.44086837768555, 29.220434188842773, 21.110217094421387, 23.555108547210693, 39.77755427360535, 33.88877713680267, 49.44438856840134, 53.72219428420067, 35.361097142100334, 62.68054857105017, 74.84027428552508, 80.42013714276254, 89.71006857138127, 46.355034285690635, 58.17751714284532, 29.58875857142266, 28.29437928571133, 18.647189642855665, 55.32359482142783, 61.661797410713916, 35.33089870535696];
  var verified_smma12results = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 57.583333333333336, 59.118055555555564, 54.8582175925926, 57.53669945987655, 58.991974504886834, 56.74264329614626, 57.43075635480074, 56.061526658567345, 52.1397327703534, 48.878088372823946, 46.97158100842196, 47.72394925772013, 46.08028681957679, 47.656929584612065, 48.518852119227724, 45.89228110929208, 49.5679243501844, 52.687263987669034, 55.46332532202995, 59.09138154519412, 54.41709974976127, 55.7156747706145, 51.15603520639663, 49.14303227253024, 45.797779583152725, 49.64796461788999, 51.177300899732494, 47.66252582475479];
  var verified_smma26results = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51.15384615384615, 49.84023668639053, 51.384842967683205, 52.75465669969539, 54.0333237497071, 55.76281129779529, 53.73347240172624, 54.35910807858292, 52.30683469094512, 51.33349489513954, 49.70528355301879, 51.33200341636422, 51.973080208042525, 50.32026943081012];

  it('should correctly calculate SMMAs with weight 2', function() {
    var smma = new SMMA(2);
    _.each(prices, function(p, i) {
      smma.update(p);
      expect(smma.result).to.equal(verified_smma2results[i]);
    });
  });

  it('should correctly calculate SMMAs with weight 12', function() {
    var smma = new SMMA(12);
    _.each(prices, function(p, i) {
      smma.update(p);
      expect(smma.result).to.equal(verified_smma12results[i]);
    });
  });

  it('should correctly calculate SMMAs with weight 26', function() {
    var smma = new SMMA(26);
    _.each(prices, function(p, i) {
      smma.update(p);
      expect(smma.result).to.equal(verified_smma26results[i]);
    });
  });
});
