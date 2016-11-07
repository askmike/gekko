<template lang='jade'>
  .contain.py2
    .text(v-html='text')
</template>

<script>

import marked from '../tools/marked';

const text = marked(`

## Live Gekko

You can use Gekko to run you strategy against the live market!

### Coming soon

Running a live Gekko using Gekko UI is being worked on. In the meantime you
can run live gekkos using the
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
