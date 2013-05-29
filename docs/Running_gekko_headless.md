# Running Gekko headlessly

Gekko is a nodejs application, this means that you can use tools for node to automatically keep Gekko running. On Unix system node applications run as normal applications: logging goes to `stdout` and errors go to `sterr`, this means you can use normal Unix tools to run Gekko silently:

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

    screen -S gekko-seesion
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