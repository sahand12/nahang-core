const debug = require('nahang-ignition').debug('app');
const express = require('express');

// App requires
const config = require('../config');

// Middleware
const compress = require('compression'); // @TODO: maybe do this with Nginx instead?

// Local Middleware
const nahangLocals = require('./middleware/nahang-locals');
const logRequest = require('./middleware/log-request');

module.exports = function setupParentApp() {
  debug('ParentApp setup start');
  const parentApp = express();

  // ## Global setting

  // Make sure `req.secure` is valid for proxied requests
  // (X-Forwarded-Proto header will be checked, if present)
  parentApp.enable('trust proxy');

  parentApp.use(logRequest);

  // Enabled gzip compression by default
  if (config.get('compress') !== false) { // @TODO: configure Nginx for this
    parentApp.use(compress());
  }

  // This sets global res.locals which are needed everywhere
  parentApp.use(nahangLocals);

  /* Mount the sub-apps (api, admin, site) on the parent app */

  // API
  parentApp.use('/nahang/api/v0.1/', require('./api/app')());

  // ADMIN
  parentApp.use('/nahang', require('./admin')());

  // SITE
  parentApp.use(require('./sites')());

  debug('ParentApp setup end');

  return parentApp;
};
