<template lang='jade'>
div.contain
  h2 Config
  .hr
  h3 API keys
  p(v-if='!apiKeySets.length')
    em You don't have any API keys yet.
  ul
    li(v-for='set in apiKeySets')
  a(href='#', v-if='!addApiToggle', v-on:click.prevent='openAddApi') add an API key
  template(v-if='addApiToggle')
    p a
  .hr
  
</template>

<script>

export default {
  data: () => {
    return {
      addApiToggle: false
    }
  },
  methods: {
    openAddApi: function() {
      this.addApiToggle = true;
    }
  },
  computed: {
    apiKeySets: function() {
      return this.$store.state.apiKeys
    }
  }
}
</script>