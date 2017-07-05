import Vue from 'vue'
import App from './App.vue'

import VueRouter from 'vue-router'
Vue.use(VueRouter);

import store from './store'

import backtester from './components/backtester/backtester.vue'
import home from './components/layout/home.vue'

import data from './components/data/data.vue'
import importer from './components/data/import/importer.vue'
import singleImport from './components/data/import/single.vue'
import config from './components/config/config.vue'

import gekkoList from './components/gekko/list.vue'
import newGekko from './components/gekko/new.vue'
import singleStratrunner from './components/gekko/singleStratrunner.vue'
import singleWatcher from './components/gekko/singleWatcher.vue'
import { connect as connectWS } from './components/global/ws'

const router = new VueRouter({
  mode: 'hash',
  base: __dirname,
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: home },
    { path: '/backtest', component: backtester },
    { path: '/config', component: config },
    { path: '/data', component: data },
    { path: '/data/importer', component: importer },
    { path: '/data/importer/import/:id', component: singleImport },
    { path: '/live-gekkos', component: gekkoList },
    { path: '/live-gekkos/new', component: newGekko },
    { path: '/live-gekkos/stratrunner/:id', component: singleStratrunner },
    { path: '/live-gekkos/watcher/:id', component: singleWatcher }
  ]
});

// setup some stuff
connectWS();

new Vue({
  router,
  store,
  el: '#app',
  render: h => h(App)
})