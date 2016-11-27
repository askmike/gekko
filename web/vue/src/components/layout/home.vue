<template lang='jade'>
  section.contain.grd-row
    .grd-row-col-3-6(v-html='left')
    .grd-row-col-3-6.txt--center
      img(src='/assets/gekko.jpg')
      p
        em The most valuable commodity I know of is information.
</template>

<script>
import marked from '../../tools/marked';

const left = marked(`

## Gekko

Gekko is a Bitcoin trading bot and backtesting platform that
connects to popular Bitcoin exchanges. It is writte in javascript
and runs on nodejs.

[Find out more](https://gekko.wizb.it/).

`);

export default {
  data: () => {
    return {
      left
    }
  }
}
</script>