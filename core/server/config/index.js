const nconf = require('nconf');
const path = require('path');
const _debug = require('nahang-ignition').debug._base;
const debug = _debug('nahang:config');
const localUtils = require('./utils');
const env = process.env.NODE_ENV || 'development';
const _private = {};

/**
 *
 * @param {string} options.baseConfigPath - Base configuration file path
 * @param {string} options.customConfigPath - User provided configuration file path
 * @param {string} options.
 */
_private.loadNconf = function loadNconf(options = {}) {
  debug('config start');

  const baseConfigPath = options.baseConfigPath || __dirname;
  const customConfigPath = options.customConfigPath || process.cwd();
  const nconf = new nconf.Provider();

  /**
   * no channel can override the overrides
   */
  nconf.file('overrides', path.join(baseConfigPath, 'overrides.json'));

  /**
   * Command line arguments
   */
  nconf.argv();

  /**
   * env arguments
   */
  nconf.env({
    separator: '__',
  });

  nconf.file('custom-env', path.join(customConfigPath, `config.${env}.json`));
  nconf.file('default-env', path.join(baseConfigPath, env, `config.${env}.json`));
  nconf.file('defaults', path.join(baseConfigPath, 'defaults.json'));

  /**
   * Transform all relative paths to absolute paths
   */
  nconf.makePathsAbsolute = localUtils.makePathsAbsolute.bind(nconf);
  nconf.getContentPath = localUtils.getContentPath.bind(nconf);
  nconf.doesContentPathExist = localUtils.doesContentPathExists.bind(nconf);

  nconf.makePathsAbsolute(nconf.get('paths'), 'paths');

  /**
   * Check if the URL in config has a protocol
   */
  nconf.checkUrlProtocol = localUtils.checkUrlProtocol.bind(nconf);
  nconf.checkUrlProtocol();

  /**
   * Ensure that the content path exists
   */
  nconf.doesContentPathExist();

  /**
   * Values we have to set manually
   */
  nconf.set('env', env);

  // Wrap this in a check, because else nconf.get() is executed unnecessarily
  // To output this, use DEBUG=nahang:*,nahang-config
  if (_debug.enabled('nahang-config')) {
    debug(nconf.get());
  }

  debug('config end');
  return nconf;
};

module.exports = _private.loadNconf();
module.exports.loadNconf = _private.loadNconf;

