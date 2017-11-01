# Gekko UI

When you launch Gekko UI, you start a basic nodejs webserver with 3 components:

- It will serve frontend (HTML/CSS/JS) files for frontend written as a [vuejs app](https://vuejs.org/) (v2).
- It will will handle API requests as [koa](http://koajs.com/) (v1) routes.
- It will start a websocket server used to broadcast messages in realtime (used for long lived processes Importing and Live Gekkos for example).

**Warning: The UI and the APIs are anything but stable.**

## Gekko UI configurables

By default Gekko UI is setup up so it runs locally on your own machine, if you want to run Gekko anywhere else please configure the GekkoUI config [todo: link] to your liking.

## Gekko UI Frontend

The frontend is setup as a very basic vue app. Additionally the following libraries are used:

- [Reconnecting websocket](https://github.com/joewalnes/reconnecting-websocket)
- [Moment](http://momentjs.com/)
- [d3.js](https://d3js.org/)
- [toml](https://github.com/BinaryMuse/toml-node)
- [humanizeDuration](https://github.com/EvanHahn/HumanizeDuration.js)

The vue app itself uses the following libraries:

- [marked](https://github.com/chjj/marked)
- [jade](https://github.com/pugjs) (all html is either written in jade of markdown)
- [vue-router](https://github.com/vuejs/vue-router)
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
    npm run dev

Gekko UI is now served from port 8080, the webpack dev server will compile the vue app (in memory) and intercept all calls to the app itself (`/dist/build.js`) and serve the in memory app. It is important to note that this UI still talks to the API served from the `node server` commmand (on default http://localhost:3000/api) 

### Recompiling the Gekko UI frontend

When you are done developing and adding your contributions by recompiling the app:

    # path to vue app
    cd gekko/web/vue
    npm run build