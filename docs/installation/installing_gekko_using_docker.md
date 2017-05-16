# Installing Gekko using Docker

*Note, this guide as well as the docker image are not updated to run gekko UI.*

Docker user? Installing and running gekko is simple on Docker with the following commands:

```
$ docker-compose build
$ HOST=mydomain.com PORT=3001 docker-compose up -d
```

You can now find your gekko instance running on mydomain.com:3001. 
By default these are set to:

```
HOST=localhost
PORT=3000
``` 

To see logs: `docker logs -f gekko_gekko_1`. View which dockers are running by executing `docker ps`.