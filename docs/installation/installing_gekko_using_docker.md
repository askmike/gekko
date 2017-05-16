# Installing Gekko using Docker

Installing and running gekko in a docker container for use on the same machine is simple with the following commands:

```
$ docker-compose build
$ docker-compose up -d
```

You can now find your gekko instance running on `localhost:3000`.

## Installing for external access

However if you want to run Gekko on another machine (in the cloud, on a server), you need to specify the host machine and its port like so:

```
$ docker-compose build
$ HOST=mydomain.com PORT=3001 docker-compose up -d
``` 

You can now find your gekko instance running on `mydomain.com:3001`.

To see logs: `docker logs -f gekko_gekko_1`. View which dockers are running by executing `docker ps`.