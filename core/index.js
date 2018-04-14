const server = require('./server');

// Set the default environment to be `development`
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function makeApp(options = {}) {
  return server(options);
}

module.exports = makeApp;
