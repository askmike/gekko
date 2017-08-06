// global window.CONFIG

const config = window.CONFIG.ui;
const host = `${config.host}${config.port === 80 ? '' : `:${config.port}`}${config.path}api/`;

// rest API path
if(config.ssl) {
  var restPath = `https://${host}`;
} else {
  var restPath = `http://${host}`;
}

// ws API path
if(config.ssl) {
  var wsPath = `wss://${host}`;
} else {
  var wsPath = `ws://${host}`;
}

export {wsPath,restPath};
