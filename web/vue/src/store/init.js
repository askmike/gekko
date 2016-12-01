import Vue from 'vue'
import Vuex from 'vuex'
import syncImports from './modules/imports/sync'
import syncWatchers from './modules/watchers/sync'

export default function() {
  syncImports();
  syncWatchers();
}