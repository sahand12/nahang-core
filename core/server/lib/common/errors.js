const _ = require('lodash');
const util = require('util');
const {errors} = require('nahang-ignition');

class NahangError extends errors.IgnitionError {
  constructor(options = {}) {
    super(options);
    this.value = options.value;
  }
}

const nahangErrors = {
  DatabaseVersionError: class DatabaseVersionError extends NahangError {
    constructor(options) {
      super(Object.assign({
        hideStack: true,
        statusCode: 500,
        errorType: 'DatabaseVersionError',
      }, options))
    }
  },
  DatabaseNotPopulatedError: class DatabaseNotPopulatedError extends NahangError {
    constructor(options) {
      super(Object.assign({
        statusCode: 500,
        errorType: 'DatabaseNotPopulatedError',
      }, options))
    }
  },
  DatabaseNotSeededError: class DatabaseNotSeededError extends NahangError {
    constructor(options) {
      super(Object.assign({
        statusCode: 500,
        errorType: 'DatabaseNotSeededError',
      }, options))
    }
  },
  EmailError: class EmailError extends NahangError {
    constructor(options) {
      super(Object.assign({
        statusCode: 500,
        errorType: 'EmailError',
      }, options))
    }
  },
};

// @FIXME
// We need to inherit all general errors from NahangError, otherwise we have
// to check instanceof IgnitionError
_.each(errors, error => {
  if (error.name === 'IgnitionError' || typeof error === 'object') {
    return;
  }
  util.inherits(error, NahangError);
});

const allErrors = Object.assign(
  {},
  errors,
  nahangErrors,
);

module.exports = allErrors;
module.exports.NahangError = NahangError;
