// TODO: rewrite tests for mocha once we use Days.

// var Day = require('../core/candleStore.js').Day;

// module.exports = {
//   //TODO(yin): Discuss test naming conventions with outhers.
//   day_assumptions: function(test) {
//     var day = new Day("my-birthsday");
//     // NOTE(yin):Yes, usualy you do test for every elementary assumption possible, if
//     // not tested by a smaller test.
//     // This helps pinpoint the cause faster and aughts to give the developer a meaninful message
//     // for each assertion test ('should' is the keyword in assertion messages).
//     test.equals(day.candles.length, 0, "Day should be initialized empty (no candles).")
//     test.equals(day.state, 'uninitialized', "Day should be initialized in state 'uninitialized'.")
//     test.done();
//   },
//   day_addCandles: function(test) {
//     var day = new Day("my-birthsday");
//     var candles = [
//         { s: 1 },
//         { s: 2 },
//         { s: 3 }
//     ];
//     day.addCandles(candles);
//     test.deepEqual(day.candles, candles, "Day should contain candles previously appended to it.");
//     test.done();
//   },
//   //NOTE(yin): Test every possibility. If smaller test pass, regrression in this test may
//   // may indicate, i.e. addCandles() replaces, and not concatenates candles.
//   day_addCandles2: function(test) {
//     var day = new Day("my-birthsday");
//     var candles = [
//         { s: 1 },
//         { s: 2 },
//         { s: 3 }
//     ];
//     var candles2 = [
//         { s: 10 },
//     ];
//     var candlesExpect = candles.concat(candles2);
//     day.addCandles(candles);
//     day.addCandles(candles2);
//     test.equals(day.candles.length, candles.length + candles2.length,
//         "Day should contain exactly as much candles as we added to it.");
//     test.deepEqual(day.candles, candlesExpect,
//         "Last candles in to a Day should be the last appended to it.")
//     test.done();
//   },
// };
