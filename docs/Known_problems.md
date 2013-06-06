# Known Problems

## Gathering Data

* When watching the BTC-e market Gekko uses Bitcoincharts for data. Setting the interval below 15 minutes is [not allowed](http://bitcoincharts.com/about/markets-api/) by Bitcoincharts. Be nice or you may get banned.
* When setting the Mt. Gox watcher interval below a couple of minutes (< 10), Gekko will not be able to get the most recent data quickly. This will cause Gekko to wait and retry again a couple of times. If you do this the data you have to wait for the data and you are spamming the Mt. Gox API.

## Trading

* When Gekko places an order at Mt. Gox it will always report that the trade was succesfull.