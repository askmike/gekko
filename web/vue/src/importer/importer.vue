<template lang='jade'>
  .contain.py2
    .text(v-html='text')
</template>

<script>

import marked from 'marked';

const text = marked(`

## Importer

In order to backtest strategies over historical data to see 
whether they would have been profitable we first need to import
some data.

### Coming soon

The importer for Gekko UI is being worked on. In the meantime you
can import exchange data using the
[commandine version](https://gekko.wizb.it/docs/).

`);

export default {
  data: () => {
    return {
      text
    }
  }
}
</script>

<style>
</style>
