import Vue from 'vue'
import Vuex from 'vuex'
import syncImports from './modules/imports/sync'

export default function() {
  syncImports();
}