import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'

import * as importMutations from './modules/imports/mutations'
import * as watchMutations from './modules/watchers/mutations'
import * as stratrunnerMutations from './modules/stratrunners/mutations'


Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

let mutations = {};

// TODO: spread syntax
_.merge(mutations, importMutations);
_.merge(mutations, watchMutations);
_.merge(mutations, stratrunnerMutations);

export default new Vuex.Store({
  state: {
    imports: [],
    stratrunners: [],
    watchers: [],
    connection: {
      connected: false,
      dirtyState: false
    }
  },
  mutations,
  strict: debug
})