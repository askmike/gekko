# Plugins

A plugin is a low level module or plugin that can act upon events bubbling
through Gekko. If you want to have custom functionality so that your rocket
flies to the moon as soon as the price hits X you should create a plugin for it.

All plugins live in `gekko/plugins`.

Note that in order to use custom plugins, you have to run Gekko over [the commandline](../commandline/about_the_commandline.md).

## Existing plugins:

- Candle Store: save trades to disk.
- Mailer: mail trading advice to your gmail account.
- Pushbullet: send messages to Pushbullet devices.
- Telegram: send messages over Telegram.
- IRC bot: logs Gekko on in an irc channel and lets users communicate with it.
- Paper Trader: simulates trades and calculates profit over these (and logs profit).
- Trading advisor (internal): calculates advice based on market data.
- Redis beacon (advanced): [see below!](#redis-beacon)

*And more! Take a look in the `gekko/plugins folder.`*

## Implementing a new plugin

If you want to add your own plugin you need to expose a constructor function inside
`plugins/[slugname of plugin].js`. The object needs methods based on which event you want
to listen to. All events can be found in [the events page](../architecture/events.md).

You also need to add an entry for your plugin inside `plugins.js` which registers your plugin for use with Gekko. Finally you need to add a configuration object to `sample-config.js` with at least:

    config.[slug name of plugin] = {
      enabled: true
    }

Besides enabled you can also add other configurables here which users can set themselves. 

That's it! Don't forget to create a pull request of the awesome plugin you've just created!
