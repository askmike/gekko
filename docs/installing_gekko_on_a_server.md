# Installing Gekko on a server

Gekko runs great headless (on a server, raspberry PI) but the default configuration assumes that you will be using a browser from the same machine to access the interface.

**Important note: if you expose Gekko to the open internet (or on a non trusted network) you are strongly recommended to put a secure reverse proxy (for example with both SSL and BasicAuth) in front of it. While we believe Gekko is hard to exploit, it allows for 24/7 backtesting which will drain your machine's resources (possible DoS).**

# Installation

Please see the normal [installing gekko](./installing_gekko.md) document, but before starting gekko please update the configuration as stated below:

# Changing configuration

In order to setup Gekko so that you can access it remotely you need to open and edit the following file: `gekko/web/vue/UIconfig.js`.


    const CONFIG = {
      headless: false, # set this to true to prevent Gekko from trying to open a browser on this local machine
      api: {
        ssl: false, # if using a reverse proxy with ssl, set to true
        host: 'localhost', # change this to the IP address (keep the brackets) of the machine (or reversed proxy)
        port: 3000, # if using a reverse proxy, set the port here
        path: '/'
      }
    }