const config = require('../../config');
const UrlService = require('./UrlService');
const urlService = new UrlService({
  disableUrlPreload: config.get('disableUrlPreload'),
});

// Singleton
module.exports = urlService;
