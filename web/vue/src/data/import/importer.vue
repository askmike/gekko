<template lang='jade'>
  div.contain.my2
    div.text(v-html='intro')
    .hr
    h3 Currently running imports
    p(v-if='imports.length === 0') You currently don't have any imports running.
    ul(v-if='imports.length')
      li(v-for='_import in imports')
        router-link(:to='"/single-import/" + _import.id') {{ _import.watch.exchange }}:{{ _import.watch.currency }}/{{ _import.watch.asset }}
        
    .hr
    h3 Start a new import
    import-config-builder(v-on:config='updateConfig')
    .hr
    .txt--center
      // router-link(to='/single-import/a').w100--s.my1.btn--blue.b(href='#') Import
      a.w100--s.my1.btn--blue(href='#', v-on:click.prevent='run') Import
</template>

<script>

import { post, get } from '../../tools/ajax'
import spinner from '../../global/blockSpinner.vue'
import importConfigBuilder from './importConfigBuilder.vue'

import marked from '../../tools/marked'

let intro = marked(`

## Import data

In order to backtest your strategies using Gekko against
historical data you first need to import data into Gekko.

`)

export default {
  created: function() {
    get('imports', (error, response) => {
      this.imports = response;
      // let _import = _.find(list, {id: id});
    });
  },
  components: {
    importConfigBuilder,
    spinner
  },
  data: () => {
    return {
      intro,
      imports: [],
      config: {}
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

      post('import', this.config, (error, response) => {
        this.$router.push({
          path: `/data/importer/import/${response.id}`,
          // this doesn't work for some reason...
          // params: {id: response.id}
        })
      });
    }
  }
}
</script>

<style>
</style>
