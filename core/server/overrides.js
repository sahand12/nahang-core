'use strict';

// @TODO: change moment to luxon ro date-fns
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const Promise = require('bluebird');

// Set default promise library of mongoose to bluebird
mongoose.Promise = Promise;

/**
 * force UTC
 *   - you can require moment or moment-timezone, both is configured to UTC
 *   - you are allowed to use new Date() to instantiate datetime values for models, because they are transformed into UTC in the model layer.
 *   - be careful when not working with models, every value from the native JS Date is local TZ
 *   - be careful when you work with date operations, therefor always wrap a date into moment
 */
moment.tz.setDefault('UTC');
