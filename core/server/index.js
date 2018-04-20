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
 * @returns {Promise<NahangServer>}
 */
async function init() { // @TODO: Account for errors
  debug('Init Start...');
  let nahangServer;
  let parentApp;

  // Initialize default internationalization, just for core now
  // (settings for language and theme no yet available here)
  common.i18n.init();
  debug('Default i18n done for core');

  models.init();
  debug('model done');

  await dbHealth.check();
  debug('DB health check done');

  // Populate any missing default settings
  // Refresh the API settings cache.
  await settings.init();
  debug('Update settings cache done');

  // Initialize the permissions actions and objects.
  await permissions.init();
  debug('Permissions done');

  parentApp = require('./web/parent-app')();
  debug('Express Apps done');

  parentApp.use(auth.init());
  debug('Auth done');

  nahangServer = new NahangServer(parentApp);
  debug('Server done');
  debug('...Init End');
  return nahangServer;
}

module.exports = init;
