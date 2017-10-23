# Installing Gekko on windows

### Note:
#### Windows does not natively support TA-lib. We are currently working on implementing the Tulip Indicators Library, which will provide similar functionality (see [#708](https://github.com/askmike/gekko/issues/708)).
#### For advanced users only: As a temporary workaround until [#708](https://github.com/askmike/gekko/issues/708) is implemented, TA-lib can be used on Windows through Bash on Windows 10. See "Installing Gekko on Windows with bash on Windows 10"

Here is a youtube video I made that shows exactly how to set up Gekko:

[![screen shot 2017-04-20 at 00 03 45](https://cloud.githubusercontent.com/assets/969743/25205894/e7f4ea64-255c-11e7-891b-28c080a9fbf2.png)](https://www.youtube.com/watch?v=R68IwVujju8)

To get Gekko running on Windows you need to do the following:

- install nodejs
- download Gekko
- install Gekko's dependencies

## Install nodejs

Gekko runs on nodejs so we have to install that first. Head over the [nodejs homepage](http://nodejs.org/) and install the LTS version of nodejs.

## Install Gekko

The easiest way to download Gekko is to go to the [Github repo](https://github.com/askmike/gekko) and click on the 'zip' button at the top. Once you have downloaded the zip file it's the easiest to extract it. When you have done that we can begin with the cool stuff:

### Open up command line

* Start 
* Type in 'cmd.exe'
* Press enter

### Install dependencies

(After every command, press enter)

First navigate to Gekko:

    cd Downloads
    cd gekko-stable
    cd gekko-stable
    
Install Gekko's dependencies:

    npm install --only=production

### Install Tulip Indicators

If you are using Windows you will need to install python and the VC++ 2015 build tool, the easiest way to do this is through node as an administrator:

    npm install windows-build-tools --global --production

Once your build tools are installed, or for other operating systems

    npm install tulind --only=production
    
### Starting Gekko

    node gekko --ui

Your browser should automatically open with the UI. If it doesn't, manually browse to [http://localhost:3000](http://localhost:3000).
    
### Stopping Gekko

In the command line hold `ctrl` + `c`.
