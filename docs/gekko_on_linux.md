## Running headlessly

If you wish to run gekko headlessly on your server you could use [nohup](http://linux.die.net/man/1/nohup) with output redirection or [screen](http://www.gnu.org/software/screen/manual/screen.html)


### With [nohup](http://linux.die.net/man/1/nohup)

    nohup node gekko &> output.log &

You will now find all your output in output.log,  the process is put in the backround and it is safe to log out from your session.
If you want to track the output in real-time you can always use [tail](http://unixhelp.ed.ac.uk/CGI/man-cgi?tail).

    tail -fn100 output.log

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
  
