console.log(`Test Biitrex`);

var util = require(__dirname + '/../core/util.js');
var config = util.getConfig();
// var dirs = util.dirs();

var DataProvider = require(__dirname + '/../exchanges/bittrex.js');


var watcher = new DataProvider(config.watch);

watcher.getTrades(null,function(err, result) { 
    console.log(result.length);
} ,false);

watcher.getPortfolio(function(err, result) {
    console.log('Portfolio: ');
    console.log(result);
});

watcher.getTicker(function(err, result) {
    console.log('Ticker: ');
    console.log(result);
});

watcher.getFee(function(err, result) {
    console.log('Fee: ');
    console.log(result);
});

console.log('Fertig');