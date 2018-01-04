# Installing Gekko

- *Windows user? Please see the doc [installing Gekko on windows](./installing_gekko_on_windows.md) instead.*
- *Docker user? You can run Gekko in a docker container, see [installing Gekko using Docker](./installing_gekko_using_docker.md) instead.*
- *Server user? In order to run Gekko headless, see [installing Gekko on a server](./installing_gekko_on_a_server.md) instead.*

Here is a video of me explaining how to install Gekko the easiest way possible:

[![screen shot 2017-04-20 at 00 03 45](https://cloud.githubusercontent.com/assets/969743/25205894/e7f4ea64-255c-11e7-891b-28c080a9fbf2.png)](https://www.youtube.com/watch?v=R68IwVujju8)

To get Gekko running you need to do the following:

- install nodejs
- download Gekko
- install Gekko's dependencies

## Installing nodejs

Gekko requires [nodejs](https://nodejs.org/en/) to be installed. Go ahead and install this if it's not already (Gekko requires at least version 6). We advice to download the current LTS.

## Downloading Gekko

The recommanded way of downloading Gekko is by using git. This makes keeping Gekko up to date a lot easier. Run this in a terminal:

    git clone git://github.com/askmike/gekko.git -b stable
    cd gekko

This will download the latest stable version of Gekko, remove the final `-b stable` part to download the current latest release (which might not be as stable).

Alternatively you can manually download the latest stable version of Gekko on the [releases page](https://github.com/askmike/gekko/releases).

## Installing Gekko's dependencies

Once you have Gekko downloaded you need to install the dependencies, open your terminal and navigate to the gekko folder and run:

    npm install --only=production

## Starting Gekko

After all the above you can start Gekko by running the following in your terminal:

    node gekko --ui

## Updating Gekko

If you installed Gekko via git, simply run:

    git pull
    npm install --only=production

If you downloaded the zip you can just download the new version. If you want to move historical data over (for backtesting purposes), copy the contents of the `history` folder found inside the gekko folder. If you have written your own strategies, don't forget to move them over as well.