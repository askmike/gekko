<template lang='jade'>
  div.contain.my2
    h3 Start a new gekko
    gekko-config-builder(v-on:config='updateConfig')
    .hr
    .txt--center(v-if='config.valid')
      a.w100--s.my1.btn--blue(href='#', v-on:click.prevent='start') Start
</template>

<script>

import { post } from '../tools/ajax'
import gekkoConfigBuilder from './gekkoConfigBuilder.vue'

export default {
  components: {
    gekkoConfigBuilder
  },
  data: () => {
    return {
      config: {}
    }
  },
  methods: {
    updateConfig: function(config) {
      this.config = config;
    },
    start: function() {
      post('startGekko', this.config, (error, response) => {
        this.$router.push({
          path: `/live-gekkos/gekko/${response.id}`
        })
      });
    }
  }
}
</script>

<style>
</style>
