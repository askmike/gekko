<template lang='jade'>
  div.contain.my2
    div.text(v-html='intro')
    .hr
    h3 Currently running imports
    p(v-if='imports.length === 0') You currently don't have any imports running.
    ul(v-if='imports.length')
      li(v-for='_import in imports')
        router-link(:to='"/data/importer/import/" + _import.id') {{ _import.watch.exchange }}:{{ _import.watch.currency }}/{{ _import.watch.asset }}

    .hr
    h3 Start a new import
    import-config-builder(v-on:config='updateConfig')
    .hr
    .txt--center
      a.w100--s.my1.btn--primary(href='#', v-on:click.prevent='run') Import
</template>

<script>

import { post } from '../../../tools/ajax'
import spinner from '../../global/blockSpinner.vue'
import importConfigBuilder from './importConfigBuilder.vue'

import marked from '../../../tools/marked'

let intro = marked(`

## Import data

The importer can download historical market data directly from the exchange.

`)

export default {
  components: {
    importConfigBuilder,
    spinner
  },
  data: () => {
    return {
      intro,
      config: {}
    }
  },
  computed: {
    imports: function() {
      return this.$store.state.imports
    }
  },
  methods: {
    daysApart: function(range) {
      let to = moment(range.to);
      let from = moment(range.from);

      return to.diff(from, 'days');
    },
    updateConfig: function(config) {
      this.config = config;
    },
    run: function() {
      let daysApart = this.daysApart(this.config.importer.daterange);

      if(daysApart < 1)
        return alert('You can only import at least one day of data..')

      let exchange = this.$store.state.exchanges[this.config.watch.exchange];
      if ("exchangeMaxHistoryAge" in exchange) {
        if (moment(this.config.importer.daterange.from) < moment().subtract(exchange.exchangeMaxHistoryAge, "days")) {
          return alert('Your date from is too old for ' + this.config.watch.exchange + '. It supports only the last ' + exchange.exchangeMaxHistoryAge + ' days..');
        }
      }

      post('import', this.config, (error, response) => {
        if(error)
          return alert(error);

        this.$store.commit('addImport', response);

        this.$router.push({
          path: `/data/importer/import/${response.id}`,
        })
      });
    }
  }
}
</script>

<style>
</style>
