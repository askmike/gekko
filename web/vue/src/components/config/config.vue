<template lang='jade'>
div.contain
  h2 Config
  .hr
  h3 Available API keys
  p(v-if='!apiKeySets.length')
    em You don't have any API keys yet.
  ul
    li(v-for='exchange in apiKeySets') {{ exchange }}
  a(href='#', v-if='!addApiToggle', v-on:click.prevent='openAddApi') add an API key
  template(v-if='addApiToggle')
    .hr
    apiConfigBuilder
  .hr
  
</template>

<script>
import apiConfigBuilder from './apiConfigBuilder.vue';

export default {
  components: {
    apiConfigBuilder
  },
  data: () => {
    return {
      addApiToggle: false,
    }
  },
  methods: {
    openAddApi: function() {
      this.addApiToggle = true;
    },
    removeApiKey: function(exchange) {

    }
  },
  computed: {
    apiKeySets: function() {
      return this.$store.state.apiKeys
    }
  },
  watch: {
    apiKeySets: function() {
      this.addApiToggle = false;
    }
  }
}
</script>