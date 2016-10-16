var ws = new WebSocket(`ws://${location.hostname}:${location.port}/`);
var messageHandlers = {};

ws.onmessage = e => {
  var data = JSON.parse(e.data);

  _.each(messageHandlers, (fn, type) => {
    if(data[type])
      messageHandlers[type](data[type]);
  });
}

modole.exports = ws;