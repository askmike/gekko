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

// Since there are is no CCI Indicator @ https://github.com/wuhkuh/talib,
// the precalculated results have been calculated with Excel :D

var high = [86, 85, 90, 95, 58, 71, 84, 98, 99, 100, 91, 95, 99, 96, 96, 90, 79, 72, 91, 81, 94, 87, 60, 93, 75, 94, 75, 93, 92, 92, 99, 99, 84, 91, 27, 67, 97, 92, 89];
var low = [1, 5, 14, 10, 20, 10, 1, 48, 64, 0, 0, 50, 15, 0, 4, 57, 1, 11, 9, 1, 1, 10, 25, 11, 16, 50, 7, 13, 74, 71, 59, 3, 1, 1, 0, 5, 1, 60, 6];
var close = [81, 24, 75, 21, 34, 25, 72, 92, 99, 2, 86, 80, 76, 8, 87, 75, 32, 65, 41, 9, 13, 26, 56, 28, 65, 58, 17, 90, 87, 86, 99, 3, 70, 1, 27, 9, 92, 68, 9];

describe('indicators/CCI', function() {

  var CCI = require(INDICATOR_PATH + 'CCI');

  //Had to limit the decimals because of rounding mistakes
  var verified_cci8results = [0, 0, 0, 0, 0, 0, 0, 165.258216, 137.978495, -78.352249, 23.011844, 66.039216, 11.260054, -110.755556, 2.108795, 60.958054, -79.830149, -40.800225, -42.00627, -103.175918, -58.657244, -37.232704, 12.844037, 31.25, 101.960784, 187.096774, -82.539683, 114.047867, 147.875064, 101.075269, 88.888889, -108.039098, -43.914081, -87.872763, -113.138686, -68.525669, 43.243243, 82.481254, -29.942756];
  var verified_cci10results = [0, 0, 0, 0, 0, 0, 0, 0, 0, -81.681682, 28.953557, 78.940028, 27.948194, -82.58317, 17.665798, 57.71725, -100.171969, -36.79078, -33.502538, -113.08642, -70.175439, -36.995092, 7.30897, -20.757021, 51.239669, 200, -99.574468, 134.51119, 166.021297, 117.174281, 100.395257, -94.147583, -33.202614, -101.396478, -115.00256, -71.976401, 27.092846, 53.157122, -49.211356];
  var verified_cci12results = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 91.97995, 35.138387, -86.288416, 30.06993, 67.713787, -85.863874, -44.274809, -51.105651, -102.536873, -68.659725, -49.02507, -14.705882, -21.217712, 42.461538, 122.124711, -94.10628, 146.91745, 197.464342, 135.599506, 111.925175, -80.55041, -23.476298, -99.837574, -126.229111, -84.671533, 30.350877, 58.954584, -61.147046];

  it('should correctly calculate CCI with period 8', function() {
    var cci = new CCI({ history: 8, constant: 0.015 });
	_.each(close,function(p,i) {
      cci.update({high: high[i], low: low[i] , close: close[i]});
	  //when i<history, cci.results returns false
	  if (typeof(cci.result) == 'boolean') cci.result = 0;
	  expect(cci.result.toFixed(6)).to.equal(verified_cci8results[i].toFixed(6));
	});
  });

  it('should correctly calculate CCI with period 10', function() {
     var cci = new CCI({ history: 10, constant: 0.015 });
	_.each(close,function(p,i) {
      cci.update({high: high[i], low: low[i] , close: close[i]});
	  if (typeof(cci.result) == 'boolean') cci.result = 0;
	  expect(cci.result.toFixed(6)).to.equal(verified_cci10results[i].toFixed(6));
	})
  });

  it('should correctly calculate CCI with period 12', function() {
     var cci = new CCI({ history: 12, constant: 0.015 });
	_.each(close,function(p,i) {
      cci.update({high: high[i], low: low[i] , close: close[i]});
	  if (typeof(cci.result) == 'boolean') cci.result = 0;
	  expect(cci.result.toFixed(6)).to.equal(verified_cci12results[i].toFixed(6));
	})
  });
});
