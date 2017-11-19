# Importing

In order to [backtest](./backtesting.md) your strategies you will need to have historical market data to test with. The easiest way of getting this data is importing it directly from the exchange using the Gekko UI (note that this is not supported at all exchanges, check [this list](../introduction/supported_exchanges.md) to see what exchanges Gekko can import from).

You can start an import by navigating to the tab "Local tab" and scrolling to the bottom and click "Go to the importer". This brings you to the importing page with this at the bottom:

![importing wizard](https://user-images.githubusercontent.com/969743/28596822-a79509cc-7192-11e7-9293-53066f598053.png)

Once you configure the market and daterange you want to watch and click import Gekko will automatically download historical market data from the exchange:

![gekko importer](https://user-images.githubusercontent.com/969743/28597211-914dbe32-7194-11e7-8352-60a69afdf846.png)
