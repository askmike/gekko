// overwrite config with test-config

var utils = require(__dirname + '/../core/util');
var testConfig = require(__dirname + '/test-config.json');
utils.setConfig(testConfig);