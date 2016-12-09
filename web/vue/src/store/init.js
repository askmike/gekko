import Vue from 'vue'
import Vuex from 'vuex'

import syncImports from './modules/imports/sync'
import syncWatchers from './modules/watchers/sync'
import syncStratrunners from './modules/stratrunners/sync'

export default function() {
  syncImports();
  syncWatchers();
  syncStratrunners();
}