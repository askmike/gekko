# Installing Gekko on a server

Gekko runs great headless (on a server, raspberry PI) but the default configuration assumes that you will be using a browser from the same machine to access the interface.

# Installation

Please see the normal [installing gekko](./installing_gekko.md) document, but before starting gekko please update the configuration as stated below:

# Configuring Gekko

In order to setup Gekko so that you can access it remotely you need to open and edit the following file: `gekko/web/vue/UIconfig.js`. You need to configure this file according to your use case:

- You want to Gekko headless in a trusted environment (eg. on a raspberry pi or old laptop in your home network) - [see here](#configuring-gekko-to-run-headless-in-a-trusted-environment).
- You want to run Gekko in the cloud on a server - [see here](#configuring-gekko-to-run-in-the-cloud).

## Configuring Gekko to run headless in a trusted environment

Edit the uiconfig file like so:

    const CONFIG = {
        headless: true,
        api: {
            host: '0.0.0.0',
            port: 3000,
        },
        ui: {
            ssl: false,
            host: 'x.x.x.x', // Set this to the IP of the machine that will run Gekko
            port: 3000,
            path: '/'
        },
        adapter: 'sqlite'

    }

You can now access the Gekko UI by going to `http://x.x.x.x:3000` in a browser (change `x.x.x.x` with the IP of the machine that will run Gekko).


## Configuring Gekko to run in the cloud

Important note: if you expose Gekko to the open internet (or on any non trusted network) you are recommended to put a secure reverse proxy (for example with both [SSL](#obtaining-a-ssl-certificate) and [BasicAuth](#create-htpasswd-for-basic-password-authentication)) in front of it. While we believe Gekko is hard to exploit, it allows for 24/7 backtesting which will drain your machine's resources (possible DoS).

The following assumes you configured a reverse proxy, if you did not simply follow [these instructions](#configuring-nginx-as-a-reverse-proxy) to do so.


    const CONFIG = {
        headless: true,
        api: {
            host: '127.0.0.1',
            port: 3000,
        },
        ui: {
            ssl: true,
            host: 'gekko.example.com',
            port: 443,
            path: '/' // change this if you are serving from something like `example.com/gekko`
        },
        adapter: 'sqlite'
    }


## Configuring NGINX as a reverse proxy

NGINX is a highly configurable, lightweight, yet easily deployed webserver allowing features such as a reverse proxying using secure sockets layer with authentication and much more.

Installing NGINX using your Operating Systems package manager of choice is pretty straight forward. For Debian Linux it is a simple sudo apt-get install nginx

Once NGINX is installed you will need to modify the configuration file. For Debian Linux the config is located at /etc/nginx/sites-enabled/default

    server {
        listen 80;
        listen [::]:80;
        server_name gekko.example.com;
        return 301 https://$server_name$request_uri;
    }

    upstream websocket {
        server localhost:3000;
    }

    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        root /var/www/html;

        ssl_certificate /etc/nginx/ssl/nginx.crt;
        ssl_certificate_key /etc/nginx/ssl/nginx.key;	

        location / {
                proxy_buffers 8 32k;
                proxy_buffer_size 64k;

                proxy_pass http://websocket;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header Host $http_host;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-NginX-Proxy true;

                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";

                proxy_read_timeout 86400s;
                proxy_send_timeout 86400s;

                auth_basic "Restricted Content";
                auth_basic_user_file /etc/nginx/.htpasswd;
        }
    }


## Obtaining a SSL certificate

Your OS may or may not ship with openssl preinstalled. In the case it doesn't, simply install openssl using your package manager of choice. eg: `sudo apt-get install openssl`.

Below you can choose between creating a self signed certificate useful if you do not have a fqdn (fully qualified domain name), or if you by chance do have a fqdn you can use certbot to obtain a Let's Encrypt CA signed certificate.


### To create a self signed certificate:

    sudo mkdir /etc/nginx/ssl
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt


### To obtain a Let's Encrypt CA signed certificate:

Install certbot, a client to obtain signed ssl certificates for your domain.

    sudo apt-get install certbot

Run the following command:

    certbot certonly --standalone -d example.com -d gekko.example.com

Modify your NGINX config and replace the ssl lines with the following:

        ssl_certificate                 /etc/letsencrypt/live/example.com/fullchain.pem;
        ssl_certificate_key             /etc/letsencrypt/live/example.com/privkey.pem;
        add_header                      Strict-Transport-Security "max-age=31536000";


## Create htpasswd for basic password authentication

Change username to desired username and enter password when prompted:

    printf "username:`openssl passwd -apr1`\n" >> /etc/nginx/.htpasswd
