var start = (config, candleSize, daterange) => {
  var util = require(__dirname + '/../../util');

  // force correct gekko env
  util.setGekkoEnv('child-process');

  // force disable debug
  config.debug = false;
  util.setConfig(config);

  var dirs = util.dirs();

  var load = require(dirs.tools + 'candleLoader');
  load(config.candleSize, candles => {
    process.send(candles);
  })
}

process.send('ready');

process.on('message', (m) => {
  if(m.what === 'start')
    start(m.config, m.candleSize, m.daterange);
});