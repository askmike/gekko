import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'

import * as importMutations from './modules/imports/mutations'
import * as watchMutations from './modules/watchers/mutations'


Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

let mutations = {};

// TODO: spread syntax
_.merge(mutations, importMutations);
_.merge(mutations, watchMutations);

export default new Vuex.Store({
  state: {
    imports: [],
    stratrunners: [],
    watchers: []
  },
  mutations,
  strict: debug
})