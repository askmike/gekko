import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'

import VueRouter from 'vue-router'

import { connect } from './components/global/ws'

connect();

Vue.use(Vuex)
Vue.use(VueRouter);

import backtester from './components/backtester/backtester.vue'
import home from './components/layout/home.vue'

import data from './components/data/data.vue'
import importer from './components/data/import/importer.vue'
import singleImport from './components/data/import/single.vue'

import gekkoList from './components/gekko/list.vue'
import newGekko from './components/gekko/new.vue'
import singleGekko from './components/gekko/single.vue'

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