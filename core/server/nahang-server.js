const debug = require('nahang-ignition').debug('server');
const Promise = require('bluebird');
const config = require('./config');
const common = require('./lib/common');
const moment = require('moment');

/**
 * NahangServer
 */
class NahangServer {
  /**
   *
   * @param {Express.Application} rootApp - Parent Express App instance
   */
  constructor(rootApp) {
    this.rootApp = rootApp;
    this.httpServer = null;
    this.connections = {};
    this.connectionId = 0;

    // Expose config module for external use.
    this.config = config;
  }

  /* Public API methods */

  /**
   * ### Start
   *
   * Starts the nahang server listening on the configured port.
   * Alternatively you can pass in your own express instance and let
   * Nahang start listening for you.
   * @param {Express.Application} externalApp - Optional express app instance.
   * @returns {bluebird} Resolves Once Nahang has started.
   */
  start(externalApp) {
    debug('Starting...');
    const rootApp = externalApp ? externalApp : this.rootApp;

    return new Promise((resolve, reject) => {
      const {host, port} = config.get('server');
      this.httpServer = rootApp.listen(host, port);

      this.httpServer.on('error', error => {
        let nahangError;

        if (error.errno === 'EADDRINUSE') {
          nahangError = new common.errors.NahangError({
            message: common.i18n.t('errors.httpServer.addressInUse.error'),
            context: common.i18n.t('errors.httpServer.addressInUse.context', {port: config.get('server').port}),
            help: common.i18n.t('errors.httpServer.addressInUse.help'),
          });
        }
        else {
          nahangError = new common.errors.NahangError({
            message: common.i18n.t('errors.httpServer.otherError.error', {errorNumber: error.errno}),
            context: common.i18n.t('errors.httpServer.otherError.context'),
            help: common.i18n.t('errors.httpServer.otherError.help'),
          });
        }

        return reject(nahangError);
      });
      this.httpServer.on('connection', this.connection.bind(this));
      this.httpServer.on('listening', () => {
        debug('...Started');
        common.events.emit('server:start');
        this.logStartMessages();
        resolve(this);
      });
    });
  }

  /**
   * ### Stop
   *
   * Returns a promise that will be fulfilled when the server stops. If
   * the server has not been started, the promise will be fulfilled immediately
   *
   * @returns {bluebird} Resolves once Nahang has stopped.
   */
  stop() {
    return new Promise(resolve => {
      if (this.httpServer === null) {
        resolve(this);
      }
      else {
        this.httpServer.close(() => {
          common.events.emit('server:stop');
          this.httpServer = null;
          this.logShutdownMessages();
          resolve(this);
        });

        this.closeConnections();
      }
    });
  }

  /**
   * ### Restart
   * Restarts the nahang application
   * @return {bluebird} Resolves once nahang has restarted.
   */
  restart() {
    return this.stop()
      .then(nahangServer => nahangServer.start());
  }

  /**
   * Hammertime
   * To be called after `stop`
   */
  hammertime() {
    common.logging.info(common.i18n.t('notices.httpServer.cantTouchThis'));
    return Promise.resolve(this);
  }

  /**
   * ## Private (internal) methods
   * @param {net.Socket} socket
   */
  connection(socket) {
    this.connectionId += 1;
    socket._nahangId = this.connectionId;

    socket.on('close', () => {
      delete this.connections[this._nahangId];
    });

    this.connections[socket._nahangId] = socket;
  }

  /**
   * Most browsers keep a persistent connection open to the server, which
   * prevents the close callback of httpServer from returning. We need to
   * destroy all connections manually.
   */
  closeConnections() {
    Object.Keys(this.connections)
      .forEach(socketId => {
        const socket = this.connections[socketId];
        if (socket) {
          socket.destroy();
        }
      });
  }

  logStartMessages() {
    if (config.get('env') === 'production') {
      common.logging.info(common.i18n.t('notices.httpServer.nahangIsRunningIn', {env: config.get('env')}));
      common.logging.info(common.i18n.t('notices.httpServer.yourAppIsAvailableOn', {url: config.get('url')})); // @FIXME: look at ghost
      common.logging.info(common.i18n.t('notices.httpServer.ctrlCToShutDown'));
    }
    else {
      common.logging.info(common.i18n.t('notices.httpServer.nahangIsRunningIn', {env: config.get('env')}));
      common.logging.info(common.i18n.t('notices.httpServer.listeningOn', {
        host: config.get('server').host,
        port: config.get('server').port,
      }));
      common.logging.info(common.i18n.t('notices.httpServer.urlConfiguredAs', {url: config.get('url')})); // @FIXME: look at ghost
      common.logging.info(common.i18n.t('notices.httpServer.ctrlCToShutDown'));
    }

    function shutdown() {
      common.logging.info(common.i18n.t('notices.httpServer.nahangHasShutdown'));

      if (config.get('env') === 'production') {
        common.logging.info(common.i18n.t('notices.httpServer.yourAppIsNowOffline'));
      }
      else {
        common.logging.info(common.i18n.t('notices.httpServer.nahangWasRunningFor'), moment.duration(process.uptime(), 'seconds').humanize());
      }

      process.exit(0);
    }

    // Ensure that Nahang exits correctly on Ctrl+C and SIGTERM
    process
      .removeAllListeners('SIGINT').on('SIGINT', shutdown)
      .removeAllListeners('SIGTERM').on('SIGTERM', shutdown);
  }

  logShutdownMessages() {
    common.logging.warn(common.i18n.t('notices.httpServer.nahangIsClosingConnections'));
  }
}

module.exports = NahangServer;
