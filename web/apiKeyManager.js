const fs = require('fs');
const _ = require('lodash');
const cache = require('./state/cache');
const broadcast = cache.get('broadcast');

const apiKeysFile = '../api-keys.js';

const prefix = `//DO NOT SHARE THIS FILE WITH ANYONE
module.exports = `;

// on init:
const noApiKeysFile = !fs.existsSync(apiKeysFile);

if(noApiKeysFile) {
  let content = prefix + '{}';
  fs.writeFileSync(apiKeysFile, content);
}

const apiKeys = require(apiKeysFile);

module.exports = {
  get: () => _.keys(apiKeys),

  // note: overwrites if exists
  add: (exchange, props) => {
    apiKeys[exchange] = props;
    fs.writeFileSync(apiKeysFile, prefix + JSON.stringify(apiKeys));

    broadcast({
      type: 'apiKeys',
      exchanges: _.keys(apiKeys)
    });
  },

  // retrieve api keys, this cannot touch the frontend
  _getApiKeyPair: key => apiKeys[key]
}