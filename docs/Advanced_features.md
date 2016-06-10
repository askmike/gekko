If you want to get the maximum out of Gekko you can look through this list to find some more advanced options.

Advanced options:

* [Running Gekko headlessly](#running-gekko-headlessly)
* [Specify a config file](#specify-a-config-file)
* [Helper files](#helper-files)
* [Building on top of the Gekko platform](#building-on-top-of-the-gekko-platform)

# Running Gekko headlessly

Gekko is a nodejs application, this means that you can use tools for node to automatically keep Gekko running. On Unix system node applications run as normal applications: logging goes to `stdout` and errors go to `sterr`, this means you can use normal Unix tools to run Gekko silently in the background:

## Run Gekko using Unix tools

You could use [nohup](http://linux.die.net/man/1/nohup) with output redirection or [screen](http://www.gnu.org/software/screen/manual/screen.html)

### With [nohup](http://linux.die.net/man/1/nohup)

    nohup node gekko &> output.log &

You will now find all your output in output.log, the process is put in the backround and it is safe to log out from your session.
If you want to track the output in real-time you can always use [tail](http://unixhelp.ed.ac.uk/CGI/man-cgi?tail).

    tail -fn100 output.log

If you want to shutdown Gekko you have to kill the process (or reboot your pc for example). To kill the process you need to find the PID. If you enter `ps ax | grep gekko` in a terminal it will list out everything 'gekko' that is running:

     3486 pts/0    S+     0:00 grep gekko
    13310 ?        Sl     0:04 node gekko.js

This means that `3486` is the PID of the command we just ran, and `13310` is the PID of the running Gekko. To kill it just run `kill 13310`.

### With [screen](http://www.gnu.org/software/screen/manual/screen.html)

    screen -S gekko-session
    node gekko

Then just detach your session with &lt;Ctrl&gt;+&lt;a&gt; followed by &lt;Ctrl&gt;+&lt;d&gt;.

In order to list your active screen sessions just hit

    screen -ls
      There is a screen on:
        57359.gekko-session (Detached)
      1 Socket in /tmp/screens/S-lockdoc.

To re-attach this session use the following command

    screen -dr 57359


  
## Run Gekko using nodejs tools

You can also use nodejs tools to keep Gekko running, this should work cross platform (so also on Windows). I would advice to look at [Forever](https://github.com/nodejitsu/forever) and [Supervisor](https://github.com/isaacs/node-supervisor). Alternatively you look at a couple of more alternatives [described on Stackoverflow](http://stackoverflow.com/questions/12701259/how-to-make-a-node-js-application-run-permanently).

# Specify a config file

You can tell Gekko what config file to use to make it easier to run Gekko more times on different exchanges, while watching each exchange. (If you configure Gekko to trade on all exchanges while only watching Mt. Gox in one single config file, Gekko will base all buy/sell actions on all exchanges based on the trends at Mt. Gox).

The repo has some example config files in config/examples.  When you check the repository, there will also be a folder called /config/user, which is setup to ignore all files in the directory using .gitignore.  It is recommended to place your config files here to avoid issues when pulling in the latest updates.

You can also use this feature to do a realtime study on what different EMA settings would generate the most profit.

To specify a different config file, you can use the following command line argument:

    node gekko --config config/user/alternative-config

or a relative path:

    node gekko --config ../../alternative-config

or a static path:

    node gekko --config home/gekko/config/user/alternative-config

# Helper files

In the bin folder, you will find various helper methods.

Use `gekko_launch.sh` to launch a gekko instance using a provided config file param from the config/user folder.  The syntax for this is simply `bin/gekko_launch.sh alternative-config`

Use `gekko_launch_screen.sh` to launch a headless instance of gekko using the outlined methods from above.    The syntax is `bin/gekko_launch_screen.sh alternative-config`

Use `gekko_screen_grab.sh` to grab the screen for the config.  The syntax is `bin/gekko_screen_grab.sh alternative-config`

Use `gekko_log_grab.sh` to start tailing the log instead of via screen.  The syntax is `bin/gekko_log_grab.sh alternative-config`

# Building on top of the Gekko platform

Gekko is built around an event emitting architecture. Those events glue core together and provide an API for [additional plugins](https://github.com/askmike/gekko/blob/stable/docs/internals/plugins.md). On default the events stay within a single Gekko (a single nodejs process), though using the [Redis Beacon plugin](https://github.com/askmike/gekko/blob/stable/docs/internals/plugins.md#redis-beacon) all events can be broadcasted on the Redis Pub/Sub system. This makes it a breeze to integrate Gekko in your own applications (which can live outside the Gekko process, outside any nodejs environment and across a network / cluster on different hosts - use your imagination).
