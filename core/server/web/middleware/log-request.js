const uuid = require('uuid');
const common = require('../../lib/common');

/**
 * @TODO:
 *  - Move middleware to ignition?
 */
module.exports = function logRequest(req, res, next) {
  const startTime = Date.now();
  const requestId = req.get('X-Request-ID') || uuid.v1();

  function logResponse() {
    res.responseTime = (Date.now() - startTime) + 'ms';
    req.requestId = requestId;
    req.userId = req.user ? (req.user.id ? req.user.id : req.user) : null;

    if (req.err && req.err.statusCode !== 404) {
      common.logging.error({req, res, err: req.err});
    }
    else {
      common.logging.info({req, res});
    }

    res.removeListener('finish', logResponse);
    res.removeListener('close', logResponse);
  }

  res.on('finish', logResponse);
  res.on('close', logResponse);
  return next();
};
