const path = require('path');
const fse = require('fs-extra');
const _ = require('lodash');

/**
 * Transform all relative paths to absolute paths
 *
 * Path must be a string.
 * Path must match minimum one / or \
 * Path can be a "." to represent current folder
 */
exports.makePathsAbsolute = function makePathsAbsolute(obj, parent) {
  const self = this;

  _.each(obj, (configValue, pathsKey) => {
    if (_.isObject(configValue)) {
      makePathsAbsolute.bind(self)(configValue, parent + ':' + pathsKey);
    }
    else if (
      _.isString(configValue) &&
      (configValue.match(/\/+|\\+/) || configValue === '.') &&
      !path.isAbsolute(configValue)
    ) {
      self.set(parent + ':' + pathsKey, path.normalize(path.join(__dirname, '../../..', configValue)));
    }
  });
};

/**
 * We can later support setting folder names via custom config values
 */
exports.getContentPath = function getContentPath(type) {
  switch (type) {
    case 'images':
      return path.join(this.get('paths:contentPath'), 'images/');
    case 'themes':
      return path.join(this.get('paths:contentPath'), 'themes/');
    case 'storage':
      return path.join(this.get('paths:contentPath'), 'adapters/', 'storage/');
    case 'logs':
      return path.join(this.get('paths:contentPath'), 'logs/');
    case 'data':
      return path.join(this.get('paths:contentPath'), 'data/');
    default:
      throw new Error('getContentPath was called with: ' + type);
  }
};

/**
 * @TODO:
 *   - content/logs folder is required right now, otherwise nahang won't start
 */
exports.doesContentPathExists = function doesContentPathExists() {
  if (!fse.pathExistsSync(this.get('paths:contentPath'))) {
    throw new Error('Your content path does not exist!, Please double check `paths.contentPath` in your custom config file e.g. config.production.json.');
  }
};

/**
 * Check if the URL in config has a protocol
 */
exports.checkUrlProtocol = function checkUrlProtocol() {
  const url = this.get('url');

  if (!url.match(/^https?:\/\//i)) {
    throw new Error('URL in config must be provided with protocol, e.g. "http://my-nahang.com"');
  }
};
