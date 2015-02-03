# BudFox

**Similar to the [movie Wallstreet](https://en.wikipedia.org/wiki/Wall_Street_(1987_film)), Gekko delegates the dirty work of getting fresh data to Bud Fox. Bud Fox delivers the data to Gekko who uses this data to make investment decisions.**

Whenever Gekko works with realtime market data, it spawns a BudFox to fetch and transform the data for every market (exchange + asset + pair, for example: `bitstamp USD/BTC`). Bud Fox will keep on fetching data from the market in semi-realtime, turn historical trades into minutley candles (and make sure every minute of data has a candle).

BudFox exposes a stream of `candles` which are fed to Gekko.

## Advanced Usage

BudFox is a small part of Gekko's core that aggregates realtime market data from any supported exchange into a readable stream of candles. Example usage:

    var config = {
        exchange: 'Bitstamp',
        currency: 'USD',
        asset: 'BTC'
    }

    new BudFox(config)
      .start()
      // convert JS objects to JSON string
      .pipe(new require('stringify-stream')())
      // output to standard out
      .pipe(process.stdout);

Outputs:

    {"start":"2015-02-02T23:08:00.000Z","open":238.21,"high":239.35,"low":238.21,"close":238.66,"vwp":8743.778447997309,"volume":203.6969347,"trades":56}
    {"start":"2015-02-02T23:09:00.000Z","open":239.03,"high":240,"low":238.21,"close":239.19,"vwp":8725.27119145289,"volume":323.66383462999994,"trades":72}
    {"start":"2015-02-02T23:10:00.000Z","open":239.19,"high":239.8,"low":234.68,"close":235,"vwp":6664.509955946812,"volume":114.67727173,"trades":48}
    {"start":"2015-02-02T23:11:00.000Z","open":237.77,"high":238.51,"low":235,"close":238.1,"vwp":3158.835462414369,"volume":41.47081054999999,"trades":28}
    {"start":"2015-02-02T23:12:00.000Z","open":237,"high":238,"low":236.78,"close":237.9,"vwp":1634.5173557116634,"volume":70.58755061,"trades":22}
    {"start":"2015-02-02T23:13:00.000Z","open":237.95,"high":238.49,"low":237.95,"close":238.49,"vwp":604.219141331534,"volume":12.196531389999999,"trades":7}
    {"start":"2015-02-02T23:14:00.000Z","open":238.51,"high":241,"low":237.89,"close":241,"vwp":7610.305142999085,"volume":579.5321983399998,"trades":67}
    {"start":"2015-02-02T23:15:00.000Z","open":238.12,"high":239.76,"low":238.12,"close":239.1,"vwp":1828.5872875471068,"volume":31.16232463,"trades":17}
    {"start":"2015-02-02T23:16:00.000Z","open":239.1,"high":239.76,"low":239.1,"close":239.67,"vwp":1339.3753800771717,"volume":5.56431998,"trades":12}
    {"start":"2015-02-02T23:17:00.000Z","open":239.27,"high":239.99,"low":239.25,"close":239.92,"vwp":1519.3392752690336,"volume":6.984999999999999,"trades":14}
    {"start":"2015-02-02T23:18:00.000Z","open":239.92,"high":239.98,"low":238.98,"close":238.98,"vwp":4162.807256131301,"volume":21.17212333,"trades":29}
    {"start":"2015-02-02T23:19:00.000Z","open":239,"high":239,"low":238.15,"close":238.33,"vwp":1627.2581467076204,"volume":31.682705360000003,"trades":15}
    {"start":"2015-02-02T23:20:00.000Z","open":238.33,"high":239.95,"low":238.33,"close":239,"vwp":3648.661808492067,"volume":128.35564560999998,"trades":23}
    // etc..