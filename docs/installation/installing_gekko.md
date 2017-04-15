# Installing Gekko

- *Windows user? Please see the doc [installing Gekko on windows](./installing_gekko_on_windows.md) instead.*
- *Docker user? You can run Gekko in a docker container, see [installing Gekko using Docker](./installing_gekko_using_docker.md) instead.*
- *Server user? In order to run Gekko headless, see [installing Gekko on a server](./installing_gekko_on_a_server.md) instead.*

## Installing nodejs

As of now Gekko requires [nodejs](https://nodejs.org/en/) to be installed. Go ahead and install this if it's not already (Gekko requires at least version 6).

## Installing Gekko

Either use Git or download the zip. For git, run this in a terminal:

    git clone git://github.com/askmike/gekko.git
    cd gekko

Alternatively download and extract [the zip here](https://github.com/askmike/gekko/archive/stable.zip).

## Installing Gekko dependencies

Once it is installed we need to install Gekko's dependencies, open your terminal and navigate to the gekko folder and run:

    npm install --only=production

## Starting Gekko

After all the above you can start Gekko by running the following in your terminal:

    node gekko --ui

## Updating Gekko

If you installed Gekko via git, simply run:

    git pull
    npm install --only=production

If you downloaded the zip you can just download the new version. If you want to move historical data over (for backtesting purposes), copy the constents of the `history` folder found inside the gekko folder. If you have written your own strategies, don't forget to move them over as well.