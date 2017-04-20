# About the commandline

You don't have to use the UI to control Gekko, you can also use the commandline if you don't have access to a window manager or browser (on a server for example, or anything else you want to SSH into). This is only recommended for advanced users who feel comfortable editing config files and running shell commands.

Using the commandline you run one Gekko instance per command, eg. if you want to import 3 markets you need to run Gekko 3 times.

## Configuring Gekko

If you decide you want to run gekko over the commandline you need to decide two things:

1. What market / settings are you interested in?
2. What should Gekko do? This is either backtest, import or run live.

For the first one you configure a config file: copy `gekko/sample-config.js` to something else (for example `gekko/config.js`). Configure the plugins to your liking. What plugins you need to enable does depend on the answer of question 2. Check the documentation under commandline for that feature.

## Running Gekko

For live mode run:

    node gekko --config config.js

To backtesting run:

    node gekko --config config.js --backtest

To import run:

    node gekko --config config.js --import