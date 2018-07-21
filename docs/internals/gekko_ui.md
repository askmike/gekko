# Gekko UI

When you launch Gekko UI, you start a basic nodejs webserver with 3 components:

- It will serve frontend (HTML/CSS/JS) files for frontend written as a [vuejs app](https://vuejs.org/) (v2.5.16).
- It will will handle API requests as [koa](http://koajs.com/) (v1) routes, it will also start a websocket server used to broadcast messages in realtime (used for long lived processes Importing and Live Gekkos for example). The server API documentation can be found [here](./server_api.md).

## Gekko UI Frontend

The frontend is setup as a very basic vue app. Additionally the following libraries are used:

- [Reconnecting websocket](https://github.com/joewalnes/reconnecting-websocket)
- [Moment](http://momentjs.com/)
- [d3.js](https://d3js.org/)
- [toml](https://github.com/BinaryMuse/toml-node)
- [humanizeDuration](https://github.com/EvanHahn/HumanizeDuration.js)

The vue app itself uses the following libraries:

- [marked](https://github.com/chjj/marked)
- [pug](https://github.com/pugjs) (all html is either written in pug of markdown)
- [vue-router](https://github.com/vuejs/vue-router)
- [vuex](https://github.com/vuejs/vuex)
- [superagent](https://github.com/visionmedia/superagent) (cross browser ajax)

### Developing for the Gekko UI frontend

You first need to install all developer dependencies so the frontend app can be recompiled on your machine.

    cd gekko/web/vue
    npm install

After this you can launch a hot reload version of the app which will automatically recompile the frontend and reload your browser:

    # path to webserver
    cd gekko/web
    # launch the server - we use this API
    node server

    # path to vue app
    cd vue
    npm run serve

Gekko UI is now served from port 8080, the webpack dev server will compile the vue app (in memory) and intercept all calls to the app itself (`/dist/js/app.xxx.js`) and serve the in memory app. It is important to note that this UI still talks to the API served from the `node server` command (on default http://localhost:3000/api).


If you have configured Gekko to run on non standards ports (using the UIconfig), you can have your config applied to the development environment by copying `gekko/web/vue/dist/UIconfig.js` to `gekko/web/vue/public/UIconfig.js`.

### Compiling the Gekko UI frontend

*Note: as part of the compilation process Gekko will reset the UIconfig in both `gekko/web/vue/dist/UIconfig.js` and `gekko/web/vue/public/UIconfig.js`. Only compile if you are ready to lose your personal changes.*

When you are done developing you can compile the app using these instructions:

    # path to vue app
    cd gekko/web/vue
    npm run build
