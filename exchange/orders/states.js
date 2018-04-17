const states = {
  // Not created
  INITIALIZING: 'INITIALIZING',

  // Created and send to the exchange, but no acknowledgement received yet
  SUBMITTED: 'SUBMITTED',

  // In the process of moving the order
  MOVING: 'MOVING',

  // Order is open on the exchange
  OPEN: 'OPEN',

  // Order is completely filled
  FILLED: 'FILLED',

  // Order is fully completed
  COMPLETED: 'COMPLETED'
}

module.exports = states;