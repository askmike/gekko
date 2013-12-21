#navigate to gekko folder, change this if your location is different
cd ~/gekko

# zip previous log files for this config
now="`date +%Y%m%d%H%M%S`"
mv log/gekko_log.$1.txt log/gekko_log.$1.$now.txt
zip -vu log/gekko_logs.zip log/gekko_log.$1.$now.txt

# remove raw text files now that they're zipped
rm log/gekko_log.$1.$now.txt

# finally launch gekko and log output to log file as well as stdout
node gekko config="config/user/$1.js" 2>&1 | tee log/gekko_log.$1.txt

