const _ = require('lodash');
const localUtils = require('./utils');
const prefetchDefaults = {
  context: {
    internal: true,
  },
  limit: 'all',
};

class Resource {
  constructor({name, api, prefetchOptions, urlLookup, events}) {
    this.name = name;
    this.api = api;
    this.prefetchOptions = prefetchOptions || {};
    this.urlLookup = urlLookup || name;
    this.events = events;
    this.items = {};
  }

  fetchAll() {
    const options = _.defaults(this.prefetchOptions, prefetchDefaults);

    return require('../../api')[this.api]
      .browse(options)
      .then(resp => {
        this.items = resp[this.api];
        return this.items;
      });
  }
}
