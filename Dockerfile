FROM node:6.3

ENV HOST localhost
ENV PORT 3000

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --production
RUN npm install redis@0.10.0 talib@1.0.2 pg

# Bundle app source
COPY . /usr/src/app

RUN chmod +x /usr/src/app/docker-entrypoint.sh
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]

CMD [ "npm", "start" ]
