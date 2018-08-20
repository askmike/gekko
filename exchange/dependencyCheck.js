const deps = require('./package.json').dependencies;

const missing = [];

Object.keys(deps).forEach(dep => {
  try {
    require(dep);
  } catch(e) {
    if(e.code === 'MODULE_NOT_FOUND') {
      missing.push(dep);
    }
  }
});

if(missing.length) {
  console.error(
    '\nThe following Gekko Broker dependencies are not installed: [',
    missing.join(', '),
    '].\n\nYou need to install them first, read here how:',
    'https://gekko.wizb.it/docs/installation/installing_gekko.html#Installing-Gekko-39-s-dependencies\n'
  );
  process.exit(1);
}
