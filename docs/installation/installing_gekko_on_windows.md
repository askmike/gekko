# Installing Gekko on windows

### Note:
#### Windows does not natively support TA-lib. We are currently working on implenting the Tulip Indicators Library, which will provide similar functionality (see [#708](https://github.com/askmike/gekko/issues/708)). 
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
    
### Starting Gekko

    node gekko --ui

Your browser should automatically open with the UI. If it doesn't, manually browse to [http://localhost:3000](http://localhost:3000).
    
### Stopping Gekko

In the command line hold `ctrl` + `c`.

## Common Problems

If you get an error like one of these, try the suggested action.

#### Failed to locate CL.exe:

`
C:\Program Files (x86)\MSBuild\Microsoft.Cpp\v4.0\V140\Microsoft.CppBuild.targets(366,5): warning MSB8003: Could not find WindowsSDKDir variable from the registry. TargetFrameworkVersion or PlatformToolset may be set to an invalid version number. 
`

`
TRACKER : error TRK0005: Failed to locate: "CL.exe". The system cannot find the file specified. 
`

`
gyp ERR! build error
gyp ERR! stack Error: C:\Program Files (x86)\MSBuild\14.0\bin\msbuild.exe failed with exit code: 1
gyp ERR! stack at ChildProcess.onExit (C:\Program Files\nodejs\node_modules\npm\node_modules\node-gyp\lib\build.js:269:23)
gyp ERR! stack at ChildProcess.emit (events.js:110:17)
gyp ERR! stack at Process.ChildProcess._handle.onexit (child_process.js:1074:12)
gyp ERR! System Windows_NT 6.3.9600
gyp ERR! command "node" "C:\Program Files\nodejs\node_modules\npm\node_modules\node-gyp\bin\node-gyp.js" "rebuild"
`

#### Suggested action:
This can happen when the needed dependencies through VS 2015 are not installed. Even if VS 2015 is installed, the dependencies are not installed until you actually _create_ a C++ project (see [here](https://stackoverflow.com/questions/33716369/error-trk0005-failed-to-locate-cl-exe/33716573#33716573)). 
So, to fix the issue, make sure VS 2015 is installed. Then, open VS 2015 and created a C++ project. It will prompt you to install the needed dependencies. Install everything it asks for.
