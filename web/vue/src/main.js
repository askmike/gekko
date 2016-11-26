import Vue from 'vue'
import App from './App.vue'

import VueRouter from 'vue-router'

import { connect } from './tools/ws'

connect();

Vue.use(VueRouter);

import backtester from './backtester/backtester.vue'
import home from './layout/home.vue'

import data from './data/data.vue'
import importer from './data/import/importer.vue'
import singleImport from './data/import/single.vue'

import gekkoList from './gekko/list.vue'
import newGekko from './gekko/new.vue'
import singleGekko from './gekko/single.vue'

const router = new VueRouter({
  mode: 'hash',
  base: __dirname,
  routes: [
    { path: '/', component: home },
    { path: '/backtest', component: backtester },
    { path: '/data', component: data },
    { path: '/data/importer', component: importer },
    { path: '/data/importer/import/:id', component: singleImport },
    { path: '/live-gekkos', component: gekkoList },
    { path: '/live-gekkos/new', component: newGekko },
    { path: '/live-gekkos/gekko/:id', component: singleGekko }
  ]
});

new Vue({
  router,
  el: '#app',
  render: h => h(App)
})