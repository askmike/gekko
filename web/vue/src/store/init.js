import Vue from 'vue'
import Vuex from 'vuex'

import syncImports from './modules/imports/sync'
import syncWatchers from './modules/watchers/sync'
import syncStratrunners from './modules/stratrunners/sync'
import syncNotifications from './modules/notifications/sync'
import syncConfig from './modules/config/sync'

export default function() {
  syncImports();
  syncWatchers();
  syncStratrunners();
  syncNotifications();
  syncConfig();
}