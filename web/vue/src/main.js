import Vue from 'vue'
import App from './App.vue'

import VueRouter from 'vue-router'

import { connect } from './tools/ws'

connect();

Vue.use(VueRouter);

import backtester from './backtester/backtester.vue'
import home from './layout/home.vue'
import importer from './data/import/importer.vue'
import gekko from './gekko/gekko.vue'
import singleImport from './data/import/singleImport.vue'
import data from './data/data.vue'

const router = new VueRouter({
  mode: 'hash',
  base: __dirname,
  routes: [
    { path: '/', component: home },
    { path: '/backtest', component: backtester },
    { path: '/data', component: data },
    { path: '/data/importer', component: importer },
    { path: '/data/importer/import/:id', component: singleImport },
    { path: '/live-gekko', component: gekko }
  ]
});

new Vue({
  router,
  el: '#app',
  render: h => h(App)
})