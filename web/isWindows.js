const os = require('os');

var isWindows = (
    os.platform() == 'win32' // true evenon 64 bit archs
    || os.release().indexOf('Microsoft') > -1 // bash on Windows 10 scenario
);

module.exports = isWindows;

