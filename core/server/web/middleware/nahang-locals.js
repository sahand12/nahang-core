const nahangVersion = require('../../lib/nahang-version');

// ### NahangLocals Middleware
// Expose the standard locals that every request will
// need to have available.
module.export = function nahangLocals(req, res, next) {
  // Make sure we have a locals value.
  res.locals = res.locals || {};
  // The current Nahang version
  res.locals.version = nahangVersion.full;
  // The current Nahang version, but only major.minor
  res.locals.safeVersion = nahangVersion.safe;
  // Relative path from URL
  // app.use('/admin', function (req, res){}) GET 'http://www.example.com/admin/new' req.path = '/new'
  res.locals.relativeUrl = req.path;

  return next();
};
