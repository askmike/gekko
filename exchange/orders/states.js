const states = {
  // Not created
  INITIALIZING: 'INITIALIZING',

  // Created and send to the exchange, but no acknowledgement received yet
  SUBMITTED: 'SUBMITTED',

  // In the process of moving the order
  MOVING: 'MOVING',

  // Order is open on the exchange
  OPEN: 'OPEN',


  // the orders below indicate a fully completed order


  // Order is completely filled
  FILLED: 'FILLED',

  // Order was succesfully cancelled
  CANCELLED: 'CANCELLED',

  // Order was rejected by the exchange
  REJECTED: 'REJECTED',

  ERROR: 'ERROR'
}

module.exports = states;