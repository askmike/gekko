var fs = require('fs');
var zlib = require('zlib');
var async = require('async');
var _ = require('lodash');
var CSVStore = require('../csv-interface.js');

var TMPDIR = "./tmp/";
var CSVNAME = "test.csv";
var CSVGEN = "gen.csv";
var CSVFILE = TMPDIR + CSVNAME;
var CSVGENFILE = TMPDIR + CSVGEN;
var CANDLES = [{s:1 ,o:2 ,h:3 ,l:4 ,c:5 ,p:6},
	       {s:10,o:20,h:30,l:40,c:50,p:60}];
var DATA = "1,2,3,4,5,6\n"
           + "10,20,30,40,50,60";

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

function buffersEqual(a, b) {
    if (!Buffer.isBuffer(a)) return undefined;
    if (!Buffer.isBuffer(b)) return undefined;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

Function.prototype.trycatch = function(catcher) {
    return _.wrap(this, function(func) {
	try {
	    func.apply('a', arguments);
	} catch(e) {
	    catcher(e);
	}
    });
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
            test.deepEqual(candles, CANDLES, "Loaded candles seem corrupt");
            test.done();
        });
    },
    test_saveFile: function(test) {
        var csv = new CSVStore({history: {directory: TMPDIR}});
        csv.write(CSVGEN, CANDLES, function(candles) {
	    fs.readFile(CSVGENFILE, function(err, buffer) {
		if(err) throw err;
		zlib.deflate(DATA, function(err, databuf) {
		    try {
			test.ok(buffersEqual(buffer, databuf), "Persisted candles seem corrupt");
			test.done();
		    } catch(e) {
			console.log(e);
		    }
		});
	    }); 
	});
    }
};
