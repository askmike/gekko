import Vue from 'vue'
import App from './App.vue'

import VueRouter from 'vue-router'

import backtester from './backtester/backtester.vue'
import home from './layout/home.vue'

import VueResource from 'vue-resource'

Vue.use(VueRouter);
Vue.use(VueResource);

const router = new VueRouter({
  mode: 'hash',
  base: __dirname,
  routes: [
    { path: '/', component: home },
    { path: '/backtest', component: backtester }
  ]
})


new Vue({
  router,
  el: '#app',
  render: h => h(App)
})