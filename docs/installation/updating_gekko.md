# Updating Gekko

## Prepare

Before updating your local version of Gekko it's good to keep a few things in mind:

- If you have configured a UIconfig (to run Gekko on a server for example) make a copy of the UIconfig file (stored in `gekko/web/vue/dist/`) first and call it something else (such as `my-UIconfig.js`). After that revert the file to it's original state (which can be found in `gekko/web/baseUIconfig.js/`) prior to updating (or git will complain).
- Check the changelog (found in the [releases page](https://github.com/askmike/gekko/releases)) for breaking changes) regarding:
  - (in case you changed the UIconfig) for changes in the UIconfig.
  - (in case you were using non standard strategies) strategy API, to make sure your strategies will run in the new version.
  - any other breaking changes specified inside the release log (such as required node and or browser versions).

## Updating to a new stable release

Run the following commands inside the Gekko directory:

    git checkout stable
    git pull
    npm install --only=production
    cd exchange
    npm install --only=production
    cd ..

## Updating the develop branch

The develop branch contains the most recent code as we are working on Gekko. In most scenarios this should considered less stable. But note that once a bug is found and fixed the fixes are applied here immediately while it takes the release of a new version to have these changes available in the stable branch.

    git checkout develop
    git pull
    npm install --only=production
    cd exchange
    npm install --only=production
    cd ..

### Compiling the frontend on the develop branch

If you are using the UI and it changed since the latest release you need to manually recompile it since (as of v0.6.2) Gekko only ships compiled frontends with new releases.

    cd web/vue
    npm install
    npm run build
    cd ../..