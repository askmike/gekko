<template lang='jade'>
  footer.p2.bg--off-white
    .contain
      p
        em Use Gekko at your own risk.
      p Using Gekko v{{ version.gekko }} and Gekko UI v{{ version.ui }}.
</template>

<script>
const gekkoPackage = require('json!../../../../package.json');
const uiPackage = require('json!../../package.json');

export default {
  data: () => {
    return {
      version: {
        gekko: gekkoPackage.version,
        ui: uiPackage.version
      }
    }
  }
}
</script>
