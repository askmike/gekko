# Installing Gekko on Raspberry Pi 2 or 3

This manual is intended for a Raspberry Pi 2 or 3 with freshly installed Raspbian Stretch (Lite).

To get Gekko running on your Pi you need to do the following:

- update your package lists
- install nodejs
- download Gekko
- install Gekko's dependencies
- (optional) Configure your Pi as a headless server in your local network

## Update your package lists

    sudo apt-get update
    sudo apt-get upgrade

## Installing nodejs

We recommend installing the latest LTS Version of Node, currently 8.x.x

    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs

Important: Ignore the errors!
=> It automatically builds from source instead, it can take over 10 minutes! Do not abort the process

## Downloading Gekko

The recommended way of downloading Gekko is by using git. This makes keeping Gekko up to date a lot easier. Run this in a terminal:

        sudo apt-get install git
    git clone git://github.com/askmike/gekko.git -b stable
    cd gekko

This will download the latest stable version of Gekko, remove the final `-b stable` part to download the current latest release (which might not be as stable).

## Installing Gekko's dependencies

Once you have Gekko downloaded you need to install the dependencies, open your terminal and navigate to the gekko folder and run:

    npm install --only=production
    cd exchange
    npm install --only=production

## Configure your Pi as a headless server

    cd web/vue/dist
    nano UIconfig.js

Set headless to true

Set api.host to 0.0.0.0

Set ui.host to Pi's IP address (e.g. 192.168.1.74)

## Starting Gekko

After all the above you can start Gekko by running the following in your terminal:

    node gekko --ui

Open your browser and type in Pi's IP:port (default port: 3000)

## Updating Gekko

See the [updating Gekko](./updating_gekko.md) doc.

## Run gekko in background
If you access Pi headless via SSH, you have to use a software like tmux to run Gekko in background

## Installing Gekko on Raspberry Pi 1
It is possible to run Gekko on Raspberry Pi 1, but you have to manually install Nodejs armv6 version
