// This config is used in the frontend

const CONFIG = {
    headless: true,
    api: {
        host: '127.0.0.1', // To expose on all interfaces use: 0.0.0.0
        port: 3000, // The port on which the api will run
    },
    ui:{
        ssl: false,
        host: 'localhost',
        port: 3000,
        path: '/'
    }
}

if(typeof window === 'undefined')
  module.exports = CONFIG;
else
  window.CONFIG = CONFIG;