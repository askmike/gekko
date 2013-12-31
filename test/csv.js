var fs = require('fs');
var zlib = require('zlib');
var async = require('async');
var CSVStore = require('../csv-interface.js');

var TMPDIR = "./tmp/";
var CSVNAME = "test.csv";
var CSVFILE = TMPDIR + CSVNAME;
var VALUES = [[1,2,3,4,5], [10,20,30,40,50]];
var DATA = "1,2,3,4,5\n10,20,30,40,50";

function deflate(file, data, next) {
    zlib.deflate(data, function(err, buffer) { next(err, file, buffer) });
}

function save(file, buffer, next) {
    fs.writeFile(file, buffer, function(err) { next(err); });
}

function cleanUp(path, next) {
    if( fs.existsSync(path) ) {
        var files = [];
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) {
		// recurse
                cleanUp(curPath);
            } else {
		// delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
    next(null, path);
}

module.exports = {
    setUp: function(done) {
        fs.existsSync(TMPDIR) || fs.mkdirSync(TMPDIR);
	async.compose(save, deflate)(CSVFILE, DATA, done);
    },
    tearDown: function(done) {
        fs.existsSync(TMPDIR) && cleanUp(TMPDIR, done);
    },
    test_loadFile: function(test) {
        var csv = new CSVStore({history: {directory: TMPDIR}});
        csv.read(CSVNAME, function(candles) {
            test.ok(candles);
            test.done();
        });
    }
};
