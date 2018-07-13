# Server API

The Gekko project has three major components:

 - [Actual Gekko instance](./architecture.md)
 - A nodejs server that:
   - starts and manages gekkos
   - broadcasts all updates from all gekkos and tracks their overall state
   - has API calls to query and manage historical data (by importing more for example)
 - [A web UI (vue frontend project)](./gekko_ui.md)

The nodejs server can also be used standalone as a webserver in combination with your own software (such as a new UI, a mobile app or a higher level backtester), see [other software](../extending/other_software.md) for examples).

The server exposes two different APIs: A websocket API to push gekko updates and a REST API for everything else.

When you run `node gekko --ui` it will automatically start a server. You can also do this manually by running:

    cd gekko/web
    node server

The server will now run on the host/port configured in `gekko/web/vue/public/UIConfig.js` (under api.host).

## REST API

### GET /api/info

Get version information of current running Gekko Server.

NOTE: The API does not have dedicated versioning, instead it uses the version of the complete Gekko project.

**response**

```
{ "version": "0.6.0" }
```

### GET /api/strategies

Get all strategies known to this Gekko. The value of the `params` key is a TOML string.

**response**

```
[
  {
    "name": "DEBUG_single-advice",
    "params": ""
  },
  {
    "name": "DEBUG_toggle-advice",
    "params": ""
  },
  {
    "name": "DEMA",
    "params": "weight = 21\n\n[thresholds]\ndown = -0.025\nup = 0.025\n"
  },
  {
    "name": "MACD",
    "params": "short = 10\nlong = 21\nsignal = 9\n\n[thresholds]\ndown = -0.025\nup = 0.025\npersistence = 1"
  },
  // etc.
]
```

### GET /api/apiKeys

Returns a list of exchanges that this Gekko has API keys stored for.

NOTE: for security reasons the Gekko never exposes the API keys themselves.

**response**

```
["bitstamp","bitfinex"]
```

### GET /api/imports

Returns a list of currently running data imports.

**response**

```
[
  {
    "watch": {
      "exchange": "poloniex",
      "currency": "USDT",
      "asset": "BTC"
    },
    "id": "765606096903592",
    "latest": "2018-04-03T07:13:00Z",
    "from": "2018-04-03 05:13",
    "to": "2018-07-03 05:13",
    "done": false
  }
]
```

### GET /api/gekkos

Returns a list of currently running and archived Gekkos.

**response**

```
{
  "live": {
    "2018-07-03-13-14-papertrader-384222057313623": {
      "mode": "realtime",
      "config": {
        // complete config that was passed when creating
      },
      "id": "2018-07-03-13-14-papertrader-384222057313623",
      "type": "leech",
      "logType": "papertrader",
      "active": true,
      "stopped": false,
      "errored": false,
      "errorMessage": false,
      "events": {
        "initial": {
          "candle": {
            "id": 419824,
            "start": "2018-07-03T04:47:00.000Z",
            "open": 6664.79999887,
            "high": 6664.79999887,
            "low": 6659.99999989,
            "close": 6659.99999989,
            "vwp": 6662.402395386147,
            "volume": 0.001202,
            "trades": 3
          },
          "portfolioChange": {
            "asset": 1,
            "currency": 100
          },
          "portfolioValueChange": {
            "balance": 6759.99999989
          }
        },
        "latest": {
          "candle": {
            "id": 419849,
            "start": "2018-07-03T05:12:00.000Z",
            "open": 6643.21466865,
            "high": 6656.58532982,
            "low": 6643.01,
            "close": 6656,
            "vwp": 6643.884436854498,
            "volume": 1.9966113400000003,
            "trades": 15
          },
          "portfolioChange": {
            "asset": 1,
            "currency": 100
          },
          "portfolioValueChange": {
            "balance": 6756
          }
        }
      },
      "start": "2018-07-03T05:14:23.582Z",
      "latestUpdate": "2018-07-03T05:14:24.090Z"
    }
  },
  "archive": {}
}
```

### GET /api/exchanges

Returns a list of supported exchanges with meta information (such as supported features and tradable markets).

**response**

```
{
    "name": "Bitstamp",
    "slug": "bitstamp",
    "currencies": [
        "USD",
        // and more
    ],
    "assets": [
        "BTC",
        // and more
    ],
    "maxTradesAge": 60,
    "maxHistoryFetch": null,
    "markets": [
        {
            "pair": [
                "USD",
                "EUR"
            ],
            "minimalOrder": {
                "amount": 5,
                "unit": "currency"
            },
            "precision": 2
        },
        // and more
    ],
    "requires": [
        "key",
        "secret",
        "username"
    ],
    "fetchTimespan": 60,
    "tid": "tid",
    "tradable": true
}
```

### POST /api/addApiKey

Adds an API key for an exchange account to Gekko. As of now only 1 API keypair can be added per exchange.

**request**

```
{
  "exchange": "bitstamp",
  "values": {
    "key": "x",
    "secret": "y"
  }
}
```

**response**

```
{
    "status": "ok"
}
```

### POST /api/removeApiKey

Removes an API key from Gekko.

**request**

```
{
  "exchange": "bitstamp"
}
```

**response**

```
{
    "status": "ok"
}
```

### POST /api/scan

Scans a daterange to find all datasets for a specific market.

**request**

```
{
  "watch": {
    exchange: "bitstamp",
    "currency": "USD",
    "asset": "BTC"
  }
}
```

**response**

```
[
    {
        "to": 1464787560,
        "from": 1464783960
    },
    {
        "to": 1479115560,
        "from": 1471112760
    }
]
```

### POST /api/scansets

Scans the database for all datasets for all markets.

**request**

```
{}
```

**response**

```
{
    "datasets": [
        {
            "exchange": "bitfinex",
            "currency": "USD",
            "asset": "BTC",
            "ranges": [
                {
                    "to": 1508551500,
                    "from": 1508493900
                }
            ]
        },
        {
            "exchange": "binance",
            "currency": "USDT",
            "asset": "BTC",
            "ranges": [
                {
                    "to": 1514351280,
                    "from": 1510632480
                },
                {
                    "to": 1522915680,
                    "from": 1522678080
                }
            ]
        },
    ],
    "errors": [
        {
            "exchange": "poloniex",
            "currency": "BTC",
            "asset": "BTC"
        }
    ]
}
```

### POST /api/backtest

Perform a backtest.

**request**

*(a valid gekko config object)*

Tweak the `config.backtestResultExporter.data` object to control what is included in the output. For example skip `stratCandles` if you only care about the final profit report. This way the server won't include megabytes of candle data in the output.

```
{
    "watch": {
        "exchange": "poloniex",
        "currency": "USDT",
        "asset": "ETH"
    },
    "paperTrader": {
        "feeMaker": 0.25,
        "feeTaker": 0.25,
        "feeUsing": "maker",
        "slippage": 0.05,
        "simulationBalance": {
            "asset": 1,
            "currency": 100
        },
        "reportRoundtrips": true,
        "enabled": true
    },
    "tradingAdvisor": {
        "enabled": true,
        "method": "MACD",
        "candleSize": 60,
        "historySize": 10
    },
    "MACD": {
        "short": 10,
        "long": 21,
        "signal": 9,
        "thresholds": {
            "down": -0.025,
            "up": 0.025,
            "persistence": 1
        }
    },
    "backtest": {
        "daterange": {
            "from": "2016-06-01T11:57:00Z",
            "to": "2016-11-13T14:57:00Z"
        }
    },
    "backtestResultExporter": {
        "enabled": true,
        "writeToDisk": false,
        "data": {
            "stratUpdates": false,
            "roundtrips": true,
            "stratCandles": true,
            "stratCandleProps": [
                "open"
            ],
            "trades": true
        }
    },
    "performanceAnalyzer": {
        "riskFreeReturn": 2,
        "enabled": true
    }
}
```

**response**

```
{
    "performanceReport": {
        "startTime": "2018-04-02 14:08:00",
        "endTime": "2018-04-05 04:08:00",
        "timespan": "3 days",
        "market": -2.159980297428632,
        "startBalance": 7083.86,
        "balance": 7424.849452897501,
        "profit": 340.989452897501,
        "relativeProfit": 4.813610840664566,
        "yearlyProfit": 48210.518806418906,
        "relativeYearlyProfit": 680.5684867631334,
        "startPrice": 6983.86,
        "endPrice": 6833.01,
        "trades": 3,
        "exposure": 0.3709677419354839,
        "sharpe": null,
        "downside": null,
        "alpha": 343.14943319492966
    },
    "roundtrips": [
        {
            "id": 0,
            "entryAt": 1522685280,
            "entryPrice": 7019.99,
            "entryBalance": 7119.6899337771,
            "exitAt": 1522768080,
            "exitPrice": 7365,
            "exitBalance": 7447.19106625,
            "duration": 82800000,
            "pnl": 327.5011324729003,
            "profit": 4.599935327508788
        },
        // and more
    ],
    "stratCandles": [
        {
            "open": 6990.06,
            "start": 1522678080
        },
        // and more
    ],
    "trades": [
        {
            "id": "trade-1",
            "adviceId": "advice-1",
            "action": "buy",
            "cost": 0.30000000000000027,
            "amount": 1.01420229,
            "price": 7019.99,
            "portfolio": {
                "asset": 1.08661475,
                "currency": 0
            },
            "balance": 7119.6899337771,
            "date": 1522685280
        },
        // and more
    ]
}
```

### POST /api/import

Start a data import.

**request**

*(a valid gekko config object)*


```
{
    "watch": {
        "exchange": "poloniex",
        "currency": "USDT",
        "asset": "BTC"
    },
    "importer": {
        "daterange": {
            "from": "2018-04-03 05:46",
            "to": "2018-07-03 05:46"
        }
    },
    "candleWriter": {
        "enabled": true
    }
}
```

**response**

NOTE: this only contains information regarding the started import, updates are pushed through the websocket.

```
{
    "watch": {
        "exchange": "poloniex",
        "currency": "USDT",
        "asset": "BTC"
    },
    "id": "7324830525419355",
    "latest": "",
    "from": "2018-04-03 05:46",
    "to": "2018-07-03 05:46"
}
```

### POST /api/startGekko

Start a gekko instance

**request**

*(a valid gekko config object)*

In order to start a stratRunner, pass a config object that includes plugins required for a stratrunner (such as paperTrader, tradingAdvisor and performanceAnalyzer).

```
{
    "watch": {
        "exchange": "poloniex",
        "currency": "USDT",
        "asset": "BTC"
    },
    "candleWriter": {
        "enabled": true,
    },
    "type": "market watcher",
    "mode": "realtime"
}
```

**response**

NOTE: this only contains information regarding the started gekko, updates from are pushed through the websocket.

```
{
    "mode": "realtime",
    "config": {
      // config that was passed in the request
    },
    "id": "2018-07-03-13-49-watcher-404457189518044",
    "type": "watcher",
    "logType": "watcher",
    "active": true,
    "stopped": false,
    "errored": false,
    "errorMessage": false,
    "events": {
        "initial": {},
        "latest": {}
    },
    "start": "2018-07-03T05:49:06.685Z"
}
```

### POST /api/stopGekko

Stop a gekko instance

**request**

```
{
    "id": "2018-07-03-13-49-watcher-404457189518044"
}
```

**response**

```
{
    "status": "ok"
}
```

### POST /api/deleteGekko

Delete a stopped gekko instance from the archive.

**request**

```
{
    "id": "2018-07-03-13-49-watcher-404457189518044"
}
```

**response**

```
{
    "status": "ok"
}
```

### POST /api/getCandles

Load candles directly from the database.

**request**

```
{
    "watch": {
        "exchange": "poloniex",
        "currency": "USDT",
        "asset": "BTC"
    },
    "daterange": {
        "to": "2018-07-03T05:53:00.000Z",
        "from": "2018-07-03T05:40:00.000Z"
    },
    "candleSize": 1
}
```

**response**

```
[
    {
        "start": 1530596400,
        "open": 6645.49999958,
        "high": 6649.83970225,
        "low": 6642,
        "close": 6642,
        "vwp": 6644.840723040122,
        "volume": 0.007383000000000001,
        "trades": 23
    },
    {
        "start": 1530596460,
        "open": 6649.69979936,
        "high": 6649.69979936,
        "low": 6642,
        "close": 6648.89999912,
        "vwp": 6645.926390922748,
        "volume": 0.007383450000000001,
        "trades": 21
    },
    // etc.
]
```

## Websocket API

A websocket server is started at the basepath of the API. Connecting to it means you'll receive update messages. Messages you send to the server via the websocket connection are completely ignored, to control the server use the REST API instead.

The possible messages are:

### import_update

Whenever there is an update regarding a running import.

```
{
  type: 'import_update',
  import_id: '7324830525419355',
  updates: {
    latest: '2018-07-03T05:49:06.685Z',
    done: false
  }
}
```

### import_error

Whenever there is a fatal error in a running import. After receiving this the import will not continue.

```
{
  type: 'import_error',
  import_id: '7324830525419355',
  error: "Error string"
}
```

### gekko_new

Whenever a new Gekko has been started.

```
{
    "type": "gekko_new",
    "id": "2018-07-03-16-37-watcher-938815758693549",
    "state": {
        "mode": "realtime",
        "config": {
          // the complete config that was passed
        },
        "id": "2018-07-03-16-37-watcher-938815758693549",
        "type": "watcher",
        "logType": "watcher",
        "active": true,
        "stopped": false,
        "errored": false,
        "errorMessage": false,
        "events": {
            "initial": {},
            "latest": {}
        },
        "start": "2018-07-03T08:37:51.965Z"
    }
}
```

### gekko_event

Whenever a gekko instance has a new Gekko event. See the [gekko events doc](../events.md) for a list of all possible events and details.

```
{
    "type": "gekko_event",
    "id": "2018-07-03-16-37-watcher-938815758693549",
    "event": {
        "type": "candle",
        "payload": {
            "start": "2018-07-03T08:38:00.000Z",
            "open": 6623.00000066,
            "high": 6623.00000066,
            "low": 6623.00000066,
            "close": 6623.00000066,
            "vwp": 6623.00000066,
            "volume": 0,
            "trades": 0
        }
    }
}
```

### gekko_stopped

Whenever a Gekko has been stopped, does not fire when the instance had a fatal error. For that see `gekko_error`.

```
{
    "type": "gekko_stopped",
    "id": "2018-07-03-16-37-watcher-938815758693549"
}
```

### gekko_error


Whenever a gekko received a fatal error and crashed.

```
{
    "type": "gekko_error",
    "id": "2018-07-03-16-37-watcher-938815758693549",
    "error": "Error message"
}
```


### gekko_archived

Whenever the server does not consider the instance to be relevant anymore, fires after a gekko has been stopped or had a fatal error. After this event the gekko instance is placed in an in memory archive. It will stay here stale (as it won't be updated) until it's deleted.

```
{
    "type": "gekko_stopped",
    "id": "2018-07-03-16-37-watcher-938815758693549"
}
```

### gekko_deleted

Whenever an archived gekko instance got deleted.

```
{
    "type": "gekko_stopped",
    "id": "2018-07-03-16-37-watcher-938815758693549"
}
```
