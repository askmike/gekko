// TODO: rewrite tests for mocha once we use Days.

// var fs = require('fs');
// var zlib = require('zlib');
// var async = require('async');
// var _ = require('lodash');
// var CSVStore = require('../core/candleStore.js');

// var TMPDIR = "./tmp/";
// var CSVNAME = "test.csv";
// var CSVGEN = "gen.csv";
// var DAY_FILE = "day.csv";
// var CSVFILE = TMPDIR + CSVNAME;
// var CSVGENFILE = TMPDIR + CSVGEN;
// var DAY_PATH = TMPDIR + DAY_FILE;
// var LOAD_DAY = "2009-01-12";
// var LOAD_FILE = "history-"+LOAD_DAY+".csv";
// var LOAD_PATH = TMPDIR + LOAD_FILE;
// var CANDLES = [{
//   s: 1,
//   o: 2,
//   h: 3,
//   l: 4,
//   c: 5,
//   p: 6
// }, {
//   s: 10,
//   o: 20,
//   h: 30,
//   l: 40,
//   c: 50,
//   p: 60
// }];
// var DATA = "1,2,3,4,5,6\n" + "10,20,30,40,50,60";
// var GEN_CANDLES = 1440;
// var CANDLES_DAY = _.map(_.range(GEN_CANDLES), function (d) {
//   //TODO(yin): Randomness in test is bad, figure out a static seed
//   var rnd = function () {
//     return Math.random() * 1000
//   }
//   return {
//     s: d,
//     o: rnd().toString(),
//     h: rnd().toString(),
//     l: rnd().toString(),
//     c: rnd().toString(),
//     p: rnd().toString()
//   };
// });

// var timer;
// var csv;

// function cleanUp(path, next) {
//   if (fs.existsSync(path)) {
//     var files = [];
//     files = fs.readdirSync(path);
//     files.forEach(function (file, index) {
//       var curPath = path + "/" + file;
//       if (fs.statSync(curPath).isDirectory()) {
//         // recurse
//         cleanUp(curPath);
//       } else {
//         // delete file
//         fs.unlinkSync(curPath);
//       }
//     });
//     fs.rmdirSync(path);
//   }
//   next(null, path);
// }

// function buffersEqual(a, b) {
//   if (!Buffer.isBuffer(a)) return undefined;
//   if (!Buffer.isBuffer(b)) return undefined;
//   if (a.length !== b.length) return false;
//   for (var i = 0; i < a.length; i++) {
//     if (a[i] !== b[i]) return false;
//   }
//   return true;
// };

// var Timer = function () {
//   this.precision = 3;
//   this.checkpoints = [];
//   this.time_now = function (note) {
//     var elapsed;
//     var cp_count = this.checkpoints.length;

//     if (cp_count > 0) {
//       var last = this.checkpoints[cp_count - 1];
//       var diff = process.hrtime(last);
//       elapsed = diff[0] * 1000 + diff[1] / 100000;
//       console.log("Elapsed: " + elapsed.toFixed(this.precision) + " ms - " + note);
//     }
//     this.checkpoints.push(process.hrtime());
//   }
// }

// function buffersEqual(a, b) {
//   if (!Buffer.isBuffer(a)) return undefined;
//   if (!Buffer.isBuffer(b)) return undefined;
//   if (a.length !== b.length) return false;
//   for (var i = 0; i < a.length; i++) {
//     if (a[i] !== b[i]) return false;
//   }
//   return true;
// };

// var Timer = function () {
//   this.precision = 3;
//   this.checkpoints = [];
//   this.time_now = function (note) {
//     var elapsed;
//     var cp_count = this.checkpoints.length;

//     if (cp_count > 0) {
//       var last = this.checkpoints[cp_count - 1];
//       var diff = process.hrtime(last);
//       elapsed = diff[0] * 1000 + diff[1] / 100000;
//       console.log("Elapsed: " + elapsed.toFixed(this.precision) + " ms - " + note);
//     }
//     this.checkpoints.push(process.hrtime());
//   }
// }

// //TODO(yin): tearDownCandleFile() at end of tests
// var setupCandleFile = function(filename, data, done) {
//   fs.existsSync(TMPDIR) || fs.mkdirSync(TMPDIR);
//   zlib.deflate(data, function(err, buffer) {
//     fs.writeFile(filename, buffer, function(err) {
//       done(err);
//     });
//   });
// }

// module.exports = {
//   // runs before each test method invocation
//   setUp: function (done) {
//     timer = new Timer();
//     csv = new CSVStore();
//     csv.directory = TMPDIR;
//     done();
//   },
//   // runs after each test method invocation
//   tearDown: function (done) {
// //    fs.existsSync(TMPDIR) && cleanUp(TMPDIR, done);
//     timer = null;
//     done();
//   },
//   test_loadFile: function (test) {
//     setupCandleFile(CSVFILE, DATA, function() {
//         timer.time_now();
//         try {
//             csv.read(CSVNAME, function (candles) {
//                 timer.time_now('candles parsed');
//                 // we must catch failed asserts and print ourself
//                 try {
//                     test.deepEqual(candles, CANDLES, "Loaded candles seem corrupt: " + candles);
//                     test.done();
//                 } catch (err) {
//                     console.log(err);
//                     throw err;
//                 }
//             });
//         } catch (err) {
//             console.log(err);
//             throw err;
//         }
//     });
//   },
//   test_saveFile: function (test) {
//     timer.time_now();
//     //TODO(yin):Mock the fs.
//     csv.write(CSVGEN, CANDLES, function (err) {
//       timer.time_now("candles written");
//       fs.readFile(CSVGENFILE, function (err, buffer) {
//         if (err) {
//             console.log(err);
//             throw err;
//         }
//         zlib.deflate(DATA, function (err, databuf) {
//           // ensure assertion's are printed 
//           try {
//             test.ok(buffersEqual(buffer, databuf), "Persisted candles seem corrupt");
//             test.done();
//           } catch (err) {
//             console.log(err);
//             throw err;
//           }
//         });
//       });
//     });
//   },
//   test_saveLoadDay: function (test) {
//     timer.time_now();
//     //TODO(yin):Mock the fs.
//     csv.write(DAY_FILE, CANDLES_DAY, function (candles) {
//       timer.time_now("candles written");
//       csv.read(DAY_FILE, function (candles) {
//         timer.time_now('candles parsed');
//         // we must catch failed asserts and print ourself
//         try {
//           test.deepEqual(candles, CANDLES_DAY);
//           test.done();
//         } catch (err) {
//           //TODO(yin):too much output be generated if this is printed
//           throw err;
//         }
//       });
//     });
//   },
//   test_candlesAreNumbers: function (test) {
//       setupCandleFile(CSVNAME, DATA, function() {
//           timer.time_now();
//           csv.read(CSVNAME, function (err, candles) {
//               timer.time_now('candles parsed');
//               try {
//                   _.each(candles, function (c) {
//                       console.log(c);
//                       //TODO(yin): This generates also too much output
//                       test.equals(typeof (c.s), 'number');
//                       test.equals(typeof (c.o), 'number');
//                       test.equals(typeof (c.h), 'number');
//                       test.equals(typeof (c.l), 'number');
//                       test.equals(typeof (c.p), 'number');
//                   });
//                   test.done();
//               } catch (err) {
//                   throw err;
//               }
//           });
//       });
//   },
//   test_loadDay: function(test) {
//       setupCandleFile(LOAD_PATH, DATA, function() {
//           csv.loadDay(LOAD_DAY, function(err, candles) {
// console.log(10);
//               try {
//                   test.equal(err, null, "No error should happen");
//                   test.deepEqual(candles, CANDLES, "Store should load candles in from a day");
//                   test.done();
//               } catch(err) {
//                   console.log(err);
//               }
//           });
//       });
//   }
// };
