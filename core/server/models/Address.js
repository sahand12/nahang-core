const mongoose = require('mongoose');

const addressSchema = new mongoose.schema({
  cn: {
    type: String,
    alias: 'country',
  },
  st: {
    type: String,
    alias: 'state',
  },
  ct: {
    type: String,
    alias: 'city',
  },
  ng: {
    type: String,
    alias: 'neighbourhood',
  },
  ds: {
    type: String,
    alias: 'district',
  },
  pad: {
    type: String,
    alias: 'postalAddress',
  },
  pc: {
    type: String,
    alias: 'postalCode',
  },
  lat: {
    type:
  }
});

module.exports = addressSchema;
