# Trading bot

Once you have run enough simulations (using [backtesting](./backtesting.md) and [paper trading](./paper_trading.md)) and you are confident in your strategy you can use Gekko as a trading bot.

Gekko will run your strategy on the live market and automatically trade on your exchange account when trade signals come out of your strategy.

## Preparation

1. Make sure you are fully confident in your strategy! If you want to play around use either the [paper trader](./paper_trader.md) or the [backtester](./backtesting.md). Once you are confident continue with this list.
2. Gekko will need to have API keys to your exchange account that have permissions to view balances and orders and create new orders. Keep in mind:
  - Gekko does NOT need withdrawal access, for your safety DO NOT create API keys that can withdraw.
  - Make sure you only use the API key for Gekko, and for nothing else. If in doubt create a new key (and remove stale ones).
  - If possible try to restrict the API key to the IP address you will run Gekko from (this makes moest sense in server environments)
3. Start your gekko through either the UI or the commandline interface!

## Notes

Gekko will trade on the market you configured that consists of two currencies (for example USD/BTC):
  - Try to not trade either of these currencies on the account you use with Gekko. (in the example above: don't trade any USD nor any BTC). 
  - Try to not withdraw or deposit more of either of these currencies.

While Gekko will handle the situations above, all the profit calculations will be incorrect since your balances are taken into account while calculating profits.