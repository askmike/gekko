// overwrite config with sample-config

var utils = require(__dirname + '/../core/util');
var testConfig = require(__dirname + '/../sample-config.js');
testConfig.debug = false;
utils.setConfig(testConfig);