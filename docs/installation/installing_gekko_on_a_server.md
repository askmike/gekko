# Installing Gekko on a server

Gekko runs great headless (on a server, raspberry PI) but the default configuration assumes that you will be using a browser from the same machine to access the interface.

# Installation

Please see the normal [installing gekko](./installing_gekko.md) document, but before starting gekko please update the configuration as stated below:

# Configuring Gekko

In order to setup Gekko so that you can access it remotely you need to open and edit the following file: `gekko/web/vue/UIconfig.js`. You need to configure this file according to your use case:

- You want to Gekko headless in a trusted environment (eg. on a raspberry pi or old laptop in your home network) - [see here](#configuring-gekko-to-run-headless-in-a-trusted-environment).
- You want to run Gekko in the cloud on a server - [see here](#configuring-gekko-to-run-in-the-cloud)

## Configuring Gekko to run headless in a trusted environment

Edit the uiconfig file like so:

    const CONFIG = {
        headless: true,
        api: {
            host: '0.0.0.0',
            port: 3000,
        },
        ui: {
            ssl: false,
            host: 'x.x.x.x', // Set this to the IP of the machine that will run Gekko
            port: 3000,
            path: '/'
        }
    }

You can now access the Gekko UI by going to `http://x.x.x.x:3000` in a browser (change `x.x.x.x` with the IP of the machine that will run Gekko).


## Configuring Gekko to run in the cloud

Important note: if you expose Gekko to the open internet (or on any non trusted network) you are recommended to put a secure reverse proxy (for example with both SSL and BasicAuth) in front of it. While we believe Gekko is hard to exploit, it allows for 24/7 backtesting which will drain your machine's resources (possible DoS).

The following assumes you configured a reverse proxy, if you did not simply follow [these instructions](#configuring-gekko-to-run-headless-in-a-trusted-environment) instead. We will assume that the reverse proxy is accepting connections on `https://gekko.example.com/` and upstreaming them to `http://localhost:3000` (where Gekko will run).


    const CONFIG = {
        headless: true,
        api: {
            host: '127.0.0.1',
            port: 3000,
        },
        ui: {
            ssl: true,
            host: 'gekko.example.com',
            port: 443,
            path: '/' // change this if you are serving from something like `example.com/gekko`
        }
    }
