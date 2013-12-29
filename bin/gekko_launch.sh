#navigate to gekko folder, change this if your location is different
cd ~/gekko

# zip previous log files for this config
now="`date +%Y%m%d%H%M%S`"
current_log=log/gekko_log.$1.txt
archive_log=log/gekko_log.$1.$now.txt

if [ -f $current_log ]; then
    mv log/gekko_log.$1.txt $archive_log
    zip -vu log/gekko_logs.zip $archive_log

    # remove raw text files now that they're zipped
    rm $archive_log
fi

# finally launch gekko and log output to log file as well as stdout
node gekko config="config/user/$1.js" 2>&1 | tee $current_log
