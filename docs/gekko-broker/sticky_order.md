# Sticky Order

An advanced order that stays at the top of the book (until the optional limit). The order will automatically stick to the best BBO until the complete amount has been filled.

TODO:

- finalize API
- add more events / ways to debug
- pull ticker data out of this order market data should flow from the broker (so we can easier move to at least public websocket streams).

## Example usage

    const Broker = require('gekko-broker');

    const gdax = new Broker({
      currency: 'EUR',
      asset: 'BTC',

      exchange: 'gdax',

      // Enables access to private endpoints.
      // Needed to create orders and fetch portfolio
      private: true,

      key: 'x',
      secret: 'y',
      passphrase: 'z'
    });

    gdax.portfolio.setBalances(console.log);

    const type = 'sticky';
    const amount = 0.002;
    const side = 'buy';
    const limit = 6555;

    const order = gdax.createOrder(type, side, amount, { limit });
    order.on('statusChange', status => console.log(status));
    order.on('filled', result => console.log(result));
    order.on('completed', result => console.log(result));