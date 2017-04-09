// global window.CONFIG

const config = window.CONFIG.ui;
const host = `${config.host}:${config.port}${config.path}api/`;

// rest API path
if(config.ssl) {
  var restPath = `https://${host}`;
} else {
  var restPath = `http://${host}`;
}
export var restPath;

// ws API path
if(config.ssl) {
  var wsPath = `wss://${host}`;
} else {
  var wsPath = `ws://${host}`;
}
export var wsPath;