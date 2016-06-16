var utils = require(__dirname + '/../core/util');
var config = utils.getConfig();
config.debug = false;
utils.setConfig(config);