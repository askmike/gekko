FROM node:6.3

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --production
RUN npm install redis@0.10.0 talib@1.0.2 pg

# Bundle app source
COPY . /usr/src/app
RUN sed -i 's/127.0.0.1/0.0.0.0/g' web/vue/UIconfig.js
RUN sed -i 's/localhost/0.0.0.0/g' web/vue/UIconfig.js

EXPOSE 3000

CMD [ "npm", "start" ]
