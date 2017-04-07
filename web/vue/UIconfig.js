// This config is used in both the
// frontend as well as the web server.

const CONFIG = {
    headless: true,
    api: {
        host: '127.0.0.1', // The interfaces on which the port will be accessible, for all use: 0.0.0.0
        port: 3000, // The port on which the api will run
    },
    ui:{
        ssl: false, // Set to true if proxy adds SSL
        host: 'localhost', // The host the ui will connect to (change this if running behind a proxy)
        port: 3000, // The port the ui will connect to (change this if running behind a proxy)
        path: '/'
    }
}

if(typeof window === 'undefined')
  module.exports = CONFIG;
else
  window.CONFIG = CONFIG;