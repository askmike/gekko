# Installing Gekko using Docker

*Note, this guide as well as the docker image are not updated to run gekko UI.*

Docker user? Installing and running gekko is simple on Docker with the following command:

    docker run -d -v /path/to/your/config.js:/usr/src/gekko/config.js --name gekko barnumd/gekko

To see process logs: `docker logs --follow gekko`. More info can be found [here](https://hub.docker.com/r/barnumd/gekko/)