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

// The precalculated results are already compared 
// to MS Excel results, more info here:
// 
// https://github.com/askmike/gekko/issues/161

var prices = [81, 24, 75, 21, 34, 25, 72, 92, 99, 2, 86, 80, 76, 8, 87, 75, 32, 65, 41, 9, 13, 26, 56, 28, 65, 58, 17, 90, 87, 86, 99, 3, 70, 1, 27, 9, 92, 68, 9];



xdescribe('indicators/DEMA', function() {

  var DEMA = require(INDICATOR_PATH + 'DEMA');

  xit('should correctly calculate DEMAs', function() {
    // TODO!
  });


});