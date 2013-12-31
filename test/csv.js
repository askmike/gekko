var fs = require('fs');

var TMPDIR = "./tmp/"
var CSVFILE = TMPDIR + "test.csv";

exports = {
    setUp: function(done) {
	var data = "1,2,3,4,5\n10,20,30,40,50";
        fs.existsSync(TMPDIR) || fs.mkdir(TMPDIR);
	fs.writeFile(CSVFLE, data, done);
    },
    tearDown: function(done) {
        fs.existsSync(TMPDIR) && fs.rm(TMPDIR);      
    }
};
