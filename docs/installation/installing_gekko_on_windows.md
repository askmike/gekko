# Installing Gekko on windows

[Gekko](https://github.com/askmike/gekko/) is an open source Bitcoin trading bot which features multiple technical analysis trading methods. It can report advice or automatically trade at a number of Bitcoin exchanges. This guide will show you how to install Gekko on Windows.

Before installing any software from the internet, it is always recommended to check the source. All of Gekko's source files are on its [Github repo](https://github.com/askmike/gekko/).

*Note that Gekko runs on every platform that supports Nodejs, so you can install it on your pc (windows, OSX, linux, etc.), server or [quadrocopter](https://speakerdeck.com/felixge/node-dot-js-quadcopter-programming).*

## Install nodejs

Gekko runs on nodejs so we have to install that first. Head over the [nodejs homepage](http://nodejs.org/) and install the LTS version of nodejs.

## Install Gekko

The easiest way to download Gekko is to go to the [Github repo](https://github.com/askmike/gekko) and click on the 'zip' button at the top. Once you have downloaded the zip file it's the easiest to extract it to your Desktop. When you have done that we can begin with the cool stuff:

### Open up command line

* Start 
* Type in 'cmd.exe'
* Press enter

### Install dependencies

(After every command, press enter)

First navigate to Gekko:

    cd Desktop
    cd gekko-[version]

*(replace version with the version)*
    
Install Gekko's dependencies:

    npm install --only=production
    
### Starting Gekko

In a command line navigated to Gekko type:

    node gekko --ui

Your browser should automatically open with the UI. If it doesn't, manually browse to [http://localhost:3000](http://localhost:3000).
    
### Stopping Gekko

In the command line hold `ctrl` + `c`.