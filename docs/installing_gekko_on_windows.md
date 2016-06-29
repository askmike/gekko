# Installing Gekko on windows

[Gekko](https://github.com/askmike/gekko/) is an open source Bitcoin trading bot which features multiple technical analysis trading methods. It can report advice or automatically trade at a number of Bitcoin exchanges. This guide will show you how to install Gekko on Windows. 

Before installing any software from the internet, it is always recommended to check the source. All of Gekko's source files are on its [Github repo](https://github.com/askmike/gekko/).

*Note that Gekko runs on every platform that supports Nodejs, so you can install it on your pc (windows, OSX, linux, etc.), server or [quadrocopter](https://speakerdeck.com/felixge/node-dot-js-quadcopter-programming).*


## Install nodejs

Gekko runs on nodejs so we have to install that first. Head over the [nodejs homepage](http://nodejs.org/) and click on install. After downloading the installer will run, you can leave everything on default.

## Install Gekko

The easiest way to download Gekko is to go to the [Github repo](https://github.com/askmike/gekko) and click on the 'zip' button at the top. Once you have downloaded the zip file it's the easiest to extract it to your Desktop. When you have done that we can begin with the cool stuff:

### Open up command line

Windows 7:

* Start 
* Type in 'cmd.exe'
* Press enter

Pre-windows 7:

* Start
* Run
* Type in 'cmd.exe'
* Press enter

### Install dependencies

(After every command, press enter)

First navigate to Gekko:

    cd Desktop
    cd gekko-0.2
    
Install Gekko's dependencies:

    npm install
    
### Running Gekko

In a command line navigated to Gekko type:

    node gekko
    
### Stopping Gekko

In the command line hold `ctrl` + `c`.
    
## Configure Gekko

Use Windows Explorer to navigate to the `gekko-stable` folder on your desktpop. Cope the file `sample-config.js` to `config.js`. Open `config.js` with a texteditor (like notepad) and check in [the documentation](https://github.com/askmike/gekko/tree/stable/docs/Configuring_gekko.md) hwo you should configure Gekko.

Remember, after changing the settings you have to stop and start Gekko!