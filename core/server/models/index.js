const path = require('path');
const mongoose = require('mongoose');
const capitalize = require('lodash/capitalize');
require('./base/listeners');

const schemas = [
  'activity',
  'address',
  'avatar',
  'location',
  'match',
  'payment',
  'order',
  'permission',
  'role',
  'tournament',
  'user',
];

const init = function init() {
  schemas.forEach(name => {
    const schema = require(path.join('.', capitalize(name)));
    mongoose.model(capitalize(name), schema);
  });
};

module.exports = init;
