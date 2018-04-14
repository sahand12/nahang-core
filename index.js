// # App Startup
// Orchestrates the startup of App when run from command line.
const startTime = Date.now();
const debug = require('nahang-ignition').debug('boot:index');
let makeNahang, express, common, parentApp;

debug('First requires...');

makeNahang = require('./core');

debug('Required nahang');

express = require('express');
common = require('./core/server/lib/common');
// urlService = require('./core/server/services/url');
parentApp = express();

debug('Initializing Nahang');
makeNahang()
  .then(nahangServer => {

    // Mount our Nahang instance on our desired subdirectory path if
    // it exists.
    parentApp.use(nahangServer.rootApp); // @FIXME: configure this to be used without urlService

    debug('Starting Nahang');

    // Let Nahang handle starting our server instance.
    return nahangServer
      .start(parentApp)
      .then(function afterStart() {
        common.logging.info('Nahang boot', (Date.now() - startTime) / 1000 + 's');

        // If IPC messaging is enabled, ensure nahang sends message to parent
        // process on successful start
        if (process.send) {
          process.send({started: true});
        }
      });
  })
  .catch(err => {
    if (!common.errors.utils.isIgnitionError(err)) {
      err = new common.errors.NahangError({err});
    }

    common.logging.error(err);

    if (process.send) {
      process.send({started: false, error: err.message});
    }

    process.exit(-1);
  });
