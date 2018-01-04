# Installing Gekko on Windows with bash on Windows 10

### Note: 
#### This guide is for advance users only! This is a temporary solution until [#708](https://github.com/askmike/gekko/issues/708) is implemented
#### You must be running a 64-bit version of Windows 10 to use Bash on Windows 10
#### TA-lib does not support Windows 10, but it can be used on Bash on Windows 10 by following these instructions 


## To get Gekko running on Bash on Windows you need to do the following:

- enable Bash on Windows 10
- install nodejs
- download and install Gekko and its dependencies
- edit the handle.js file
- install the correct version of TA-lib

## Enable Bash on Windows 10

To install Bash shell on your Windows 10 PC, do the following (see [here](https://www.windowscentral.com/how-install-bash-shell-command-line-windows-10) for more info):

- Open Settings. 
- Click on Update & security. 
- Click on For Developers.
- Under "Use developer features", select the Developer mode option to setup the environment to install Bash.
- On the message box, click Yes to turn on developer mode.
- After the necessary components install, you'll need to restart your computer. 
- Once your computer reboots, open Control Panel. 
- Click on Programs.
- Click on Turn Windows features on or off.
- Check the Windows Subsystem for Linux (beta) option.
- Click OK.
- Once the components installed on your computer, click the Restart now button to complete the task.

After your computer restarts, you will notice that Bash will not appear in the "Recently added" list of apps, this is because Bash isn't actually installed yet. Now that you have setup the necessary components, use the following steps to complete the installation of Bash:

- Open Start, do a search for bash.exe, and press Enter.
- On the command prompt, type y and press Enter to download and install Bash from the Windows Store.

Then you'll need to create a default UNIX user account. This account doesn't have to be the same as your Windows account. Enter the username in the required field and press Enter (you can't use the username "admin"). Close the "bash.exe" command prompt.
Now that you completed the installation and setup, you can open the Bash tool from the Start menu like you would with any other app.

## Install nodejs

Gekko runs on nodejs so we have to install that first. 

Open up bash and install node.js: (taken from [here](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions))

```
sudo apt-get update
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential
```

## Install Gekko and its dependencies

The easiest way to download Gekko is to use Git: 

- Install Git

`sudo apt-get install git`

- Download and install gekko in you home directory (/home/yourusername): (taken from [here](https://gekko.wizb.it/docs/installation/installing_gekko.html)):

```
git clone git://github.com/askmike/gekko.git
cd gekko
npm install --only=production
```

### Starting Gekko

`node gekko --ui`

Your browser should automatically open with the UI. If it doesn't, manually browse to [http://localhost:3000](http://localhost:3000).
    
### Stopping Gekko

In bash hold `ctrl` + `c`.
