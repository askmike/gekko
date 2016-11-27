import Vue from 'vue'
import Vuex from 'vuex'
import { addImport, syncImports, updateImport } from './modules/imports/mutations'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  state: {
    imports: [],
    gekkos: [],
    watchers: []
  },
  mutations: {
    addImport,
    syncImports,
    updateImport
  },
  strict: debug
})