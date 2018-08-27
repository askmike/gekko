# Events

As described in the [architecture](./architecture.md) events play a key role in the complete system: they relay all information between separate components (like [plugins](./plugins.md)). This makes the codebase scalable, testable and it separates concerns.

if you run the Gekko UI events are relayed between core components as well as broadcasted (via the UI server) to the web UI. This means that all events broadcasted by any plugin automatically end up in the web UI.

Note that all events from Gekko come from a plugin (with the exception of the `candle` event, which comes from the market), and no plugin is required for Gekko to run, this means it might be possible that some events are never broadcasted since their originating plugin is not active. If a plugin wants to listen to an event that will never be broadcasted (because of a lack of another plugin) this will be warned in the console like so:

    (WARN): Paper Trader wanted to listen to the tradingAdvisor, however the tradingAdvisor is disabled.

## List of events emitted by standard plugins

- [candle](#candle-event): Every time Gekko calculates a new one minute candle from the market.
- [stratWarmupCompleted](#stratWarmupCompleted-event): When the strategy is done warming up.
- [advice](#advice-event): Every time the trading strategy has a new trading signal.
- [stratUpdate](#stratUpdate-event): Every time the strategy has processed a new strat candle.
- [stratNotification](#stratNotification-event): Every time the strategy emit new strategy notification.
- [tradeInitiated](#tradeInitiated-event): Every time a trading plugin (either the live trader or the paper trader) is going to start a new trade (buy or sell).
- [tradeCompleted](#tradeCompleted-event): Every time a trading plugin (either the live trader or the paper trader) has completed a trade.
- [tradeAborted](#tradeAborted-event): Every time a trading plugin (either the live trader or the paper trader) has NOT acted on new advice (due to insufficient funds or a similar reason).
trader) has NOT acted on new advice (due to unsufficiant funds or a similar reason).
- [tradeErrored](#tradeErrored-event): Every time the live trader was unable to execute an initialized.
- [tradeCancelled](#tradeCancelled-event): Every time the live trader cancelled a not yet executed trade.
- [portfolioChange](#portfolioChange-event): Every time the content of the portfolio has changed.
- [portfolioValueChange](#portfolioValueChange-event): Every time value of the portfolio has changed.
- [performanceReport](#performanceReport-event): Every time the profit report was updated.
- [roundtrip](#roundtrip-event): Every time a new roundtrip has been completed.
- [triggerCreated](#triggerCreated-event): Every time a trader has created a new trigger.
- [triggerFired](#triggerFired-event): Every time a created trigger has fired.
- [triggerAborted](#triggerAborted-event): Every time a created trigger has been aborted due to new advice.

Beside those there are also two additional market events that are only emitted when Gekko is running in realtime mode (NOT during a backtest for performance reasons).

- [marketStart](#marketStart-event): Once, when the market just started.
- [marketUpdate](#marketUpdate-event): Whenever the market has fetched new raw market data.

### candle event

- What: An object containing a one minute candle from the market.
- When: In liquid markets roughly every minute.
- Subscribe: Your plugin can subscribe to this event by registering the `processCandle` method.
- Async: When subscribing to this event the second argument will be a callback which you are expected to call when done handling this event.
- Notes:
  - Depending on the gekko configuration these candles might be historical on startup. If this is a concern for consumers, make sure to deal with this properly.
  - In illiquid markets (of less than a trade per minute) Gekko will calculate these candles in batches and a few might come at the same time.
  - These are always one minute candles, this is the lowest level of market data flowing through a gekko stream.
- Example:
      {
        start: [moment object of the start time of the candle],
        open: [number, open of candle],
        high: [number, high of candle],
        low: [number, low of candle],
        close: [number, close of candle],
        vwp: [number, average weighted price of candle],
        volume: [number, total volume volume],
        trades: [number, amount of trades]
      }

### stratWarmupCompleted event

- What: An object signaling that the strategy is now completely warmed up
and will start signaling advice.
- When: Once the strategy consumed more market data than defined by the required history.
- Subscribe: You can subscribe to this event by registering the `processWarmupCompleted` method.
- Notes:
  - This event is triggered on init when the strategy does not require any history (and thus no warmup time).
- Example:
      {
        start: [moment object of the start time of the first candle after the warmup],
      }

### stratCandle event

- What: An object describing an updated strat candle the strat has processed.
- When: when the strategy is initialized is started.
- Subscribe: You can subscribe to this event by registering the `processStratCandle` method.
- Notes:
  - This is the candle that the strategy sees: if you configured the candleSize to 60 (minutes) this event will contain a 60 minute candle.
  - Strat Candles are emitted while the strategy is still warming up (before the `stratWarmupCompleted` event).
- Example:
      {
        start: [moment object of the start time of the candle],
        open: [number, open of candle],
        high: [number, high of candle],
        low: [number, low of candle],
        close: [number, close of candle],
        vwp: [number, average weighted price of candle],
        volume: [number, total volume volume],
        trades: [number, amount of trades]
      }


### stratUpdate event

- What: An object describing updated state of the strategy based on a new strat candle.
- When: when the strategy has
- Subscribe: You can subscribe to this event by registering the `processStratUpdate` method.
- Notes:
  - Strat updates are emitted while the strategy is still warming up (before the `stratWarmupCompleted` event).
- Example:
      {
        date: [moment object of the start time of the candle],
        indicators: {
          mymacd: [number, result of running this indicator over current candle]
        }
      }

### stratNotification event

- What: An object describing new notification from your strategy
- When: when the strategy emit using `this.notify()` function
- Subscribe: You can subscribe to this event by registering the `processStratNotification` method.
- Example:
      {
        date: [moment object of the start time of the candle],
        content: [String content notification in strategy]
      }


### advice event

- What: An advice from the strategy, the advice will either be LONG or SHORT.
- When: This depends on the strategy and the candleSize.
- Subscribe: You can subscribe to this event by registering the `processAdvice` method.
- Example:
      {
        recommendation: [position to take, either long or short],
        date: [moment object of this advice],
        id: [string identifying this unique trade],
        trigger: {
          type: [type of trigger, currently always "trailingStop"],
          // optional parameters per type of trigger
        }
      }

### tradeInitiated event

- What: An object signaling that a new trade will be executed.
- When: At the same time as the advice event if the trader will try to trade.
- Subscribe: You can subscribe to this event by registering the `processTradeInitiated` method.
- Example:
      {
        id: [string identifying this unique trade],
        adviceId: [number specifying the advice id this trade is based on],
        action: [either "buy" or "sell"],
        date: [moment object, exchange time trade completed at],
        portfolio: [object containing amount in currency, asset and total balance],
        balance: [number, total worth of portfolio]
      }

### tradeAborted event

- What: An object signaling the fact that the trader will ignore the advice.
- When: At the same time as the advice event if the trader will NOT try to trade.
- Subscribe: You can subscribe to this event by registering the `processTradeAborted` method.
- Example:
      {
        id: [string identifying this unique trade],
        adviceId: [number specifying the advice id this trade is based on],
        action: [either "buy" or "sell"],
        date: [moment object, exchange time trade completed at],
        reason: [string explaining why the trade was aborted]
      }

### tradeCancelled event

- What: An object signaling the fact that the a trade originally initiated was now cancelled.
- When: After a receiving a tradeInitiated event and than a advice event (without a tradeCompleted event between them).
- Subscribe: You can subscribe to this event by registering the `processTradeCanceled` method.
- Example:
      {
        id: [string identifying this unique trade],
        adviceId: [number specifying the advice id this trade is based on],
        date: [moment object, exchange time trade completed at]
      }

### tradeErrored event

- What: An object singaling the fact that the a trade orginially initiated was now cancelled
- When: After a tradeInitiated event
- Subscribe: You can subscribe to this event by registering the `processTradeErrored` method.
- Example:
      {
        id: [string identifying this unique trade],
        adviceId: [number specifying the advice id this trade is based on],
        date: [moment object, exchange time trade completed at],
        reason: [string explaining why the trade was aborted]
      }

### tradeCompleted event

- What: Details of a completed trade.
- When: Some point in time after the tradeInitiated event.
- Subscribe: You can subscribe to this event by registering the `processTradeCompleted` method.
- Example:
      {
        id: [string identifying this unique trade],
        adviceId: [number specifying the advice id this trade is based on],
        action: [either "buy" or "sell"],
        price: [number, average price that was sold at],
        amount: [number, how much asset was trades (excluding "cost")],
        cost: [number the amount in currency representing fee, slippage and other execution costs],
        date: [moment object, exchange time trade completed at],
        portfolio: [object containing amount in currency and asset],
        balance: [number, total worth of portfolio],
        feePercent: [the cost in fees],
        effectivePrice: [executed price - fee percent, if effective price of buy is below that of sell you are ALWAYS in profit.]
      }

### portfolioChange event

- What: An object containing new portfolio contents (amount of asset & currency).
- When: Some point in time after the advice event, at the same time as the tradeCompleted event.
- Subscribe: You can subscribe to this event by registering the `processPortfolioChange` method.
- Example:
      {
        currency: [number, portfolio amount of currency],
        asset: [number, portfolio amount of asset],
      }

### portfolioValueChange event

- What: An object containing the total portfolio worth (amount of asset & currency calculated in currency).
- When: Every time the value of the portfolio has changed, if the strategy is in a LONG position this will be every minute.
- Subscribe: You can subscribe to this event by registering the `processPortfolioValueChange` method.
- Example:
      {
        value: [number, portfolio amount of currency]
      }

### performanceReport event

- What: An object containing a summary of the performance of the "tradebot" (advice signals + execution).
- When: Once every new candle.
- Subscribe: You can subscribe to this event by registering the `processPerformanceReport` method.
- Example:
      {
        startTime: Moment<'2017-03-25 19:41:00'>,
        endTime: Moment<'2017-03-25 20:01:00'>,
        timespan: 36000000,
        market: -0.316304880517734,
        balance: 1016.7200029226638,
        profit: -26.789997197336106,
        relativeProfit: -2.5672966425099304,
        yearlyProfit: '-704041.12634599',
        relativeYearlyProfit: '-67468.55576516',
        startPrice: 945.80000002,
        endPrice: 942.80838846,
        trades: 10,
        roundtrips: 5,
        startBalance: 1043.5100001199999,
        sharpe: -2.676305165560598
      }

### roundtripInitiated event

- What: A summary of a started roundtrip.
- When: After every tradeCompleted with action `buy`.
- Subscribe: You can subscribe to this event by registering the `processRoundtripInitiated` method.
- Example:
      {
        id: [string identifying this roundtrip],
        entryAt: Moment<'2017-03-25 19:41:00'>,
        entryPrice: 10.21315498,
        entryBalance: 98.19707799420277,
        exitAt: Moment<'2017-03-25 19:41:00'>
        exitPrice: 10.22011632,
        exitBalance: 97.9692176,
        duration: 3600000,
        pnl: -0.2278603942027786,
        profit: -0.2320439659276161,
      }

### roundtripUpdate event

- What: An updated summary of a currently open roundtrip.
- When: On every candle for as long as the bot is in a long position.
- Subscribe: You can subscribe to this event by registering the `processRoundtripUpdate` method.
- Example:
      {
        id: [string identifying this roundtrip],
        at: Moment<'2017-03-25 19:41:00'>,
        duration: 3600000,
        uPnl: -0.2278603942027786,
        uProfit: -0.2320439659276161,
      }

### roundtrip event

- What: A summary of a completed roundtrip (buy + sell signal).
- When: After every roundtrip: a completed sell trade event that superceded a buy sell trade event.
- Subscribe: You can subscribe to this event by registering the `processRoundtrip` method.
- Example:
      {
        id: [string identifying this roundtrip],
        entryAt: Moment<'2017-03-25 19:41:00'>,
        entryPrice: 10.21315498,
        entryBalance: 98.19707799420277,
        exitAt: Moment<'2017-03-25 19:41:00'>
        exitPrice: 10.22011632,
        exitBalance: 97.9692176,
        duration: 3600000,
        pnl: -0.2278603942027786,
        profit: -0.2320439659276161,
      }

### triggerCreated event

- What: A summary of a created trigger.
- When: After a buy advice that includes a stop.
- Subscribe: You can subscribe to this event by registering the `processTriggerCreated` method.
- Example:
      {
        id: [string identifying this trigger],
        date: Moment<'2017-03-25 19:41:00'>,
        type: type: "trailingStop",
        properties: {
          initialPrice: 100,
          trail: 10
        }
      }

### triggerFired event

- What: A message indicating a created trigger has fired
- When: As soon as the trigger fired
- Subscribe: You can subscribe to this event by registering the `processTriggerFired` method.
- Example:
      {
        id: [string identifying this trigger],
        date: Moment<'2017-03-25 19:41:00'>
      }

### triggerAborted event

- What: A message indicating a created trigger has been aborted
- When: After an advice signal indicating a sell
- Subscribe: You can subscribe to this event by registering the `processTriggerAborted` method.
- Example:
      {
        id: [string identifying this trigger],
        date: Moment<'2017-03-25 19:41:00'>
      }

### marketStart event

- What: A moment object describing the first date of the market data.
- When: When the market is started.
- Subscribe: Your plugin can subscribe to this event by registering the `processMarketStart` method.
- Example:
      [moment object describing the date of the first market data]

### marketUpdate event

- What: A moment object describing the point in time for up to which the market has market data.
- When: Every few seconds.
- Subscribe: Your plugin can subscribe to this event by registering the `processMarketUpdate` method.
- Example:
      [moment object describing the date of the latest market data]
