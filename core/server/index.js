// # Bootup
// This file needs serious love and refactoring

/**
 * Make sure overrides gets called first
 * - Keeping the overrides required here works for installing nahang as npm!
 *
 * The call order is the following
 * - root index requires core module (core/index.js)
 * - core index requires server module (core/server/index.js)
 * - override is the first package to load
 */
require('./overrides');

const debug = require('nahang-ignition').debug('boot:init');
const common = require('./lib/common');
const models = require('./models');
const permissions = require('./services/permissions');
const auth = require('./services/auth');
const dbHealth = require('./data/db/health');
const NahangServer = require('./nahang-server');
const settings = require('./services/settings');

// # Initialize Nahang
/**
 * @returns {Promise}
 */
function init() {
  debug('Init Start...');
  let nahangServer;
  let parentApp;

  // Initialize default internationalization, just for core now
  // (settings for language and theme no yet available here)
  common.i18n.init();
  debug('Default i18n done for core');

  models.init();
  debug('model done');

  // Returns a Promise which resolves to NahangServer instance.
  return dbHealth.check()
    .then(initSettings)
    .then(initPermissions)
    .then(setupParentApp)
    .then(initAuth)
    .then(returnServer);

  function initSettings() {
    debug('DB health check done');

    // Populate any missing default settings
    // Refresh the API settings cache.
    return settings.init();
  }

  function initPermissions() {
    debug('Update settings cache done');

    // Initialize the permissions actions and objects.
    return permissions.init();
  }

  function setupParentApp() {
    debug('Permissions done');

    parentApp = require('./web/parent-app')();
    debug('Express Apps done');
  }

  function initAuth() {
    parentApp.use(auth.init());
    debug('Auth done');

    return new NahangServer(parentApp);
  }

  function returnServer(_nahangServer) {
    nahangServer = _nahangServer;
    debug('Server done');
    debug('...Init End');
    return nahangServer;
  }
}

module.exports = init;
