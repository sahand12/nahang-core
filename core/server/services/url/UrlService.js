/**
 * # URL Service
 *
 * This file defines a class of URLService, which serves as a centralized
 * place to handle generating, storing & fetching URLs of all kinds.
 */
const _ = require('lodash');
const Promise = require('bluebird');
const _debug = require('nahang-ignition').debug._base;
const debug = _debug('nahang:services:url');
const common = require('../../lib/common');
// @TODO: make this dynamic
const resourceConfig = require('./config.json');
const Resource = require('./Resource');
const urlCache = require('./cache');
const localUtils = require('./utils');

class UrlService {
  constructor(options) {
    this.resources = [];
    this.utils = localUtils;

    _.each(resourceConfig, config => this.resources.push(new Resource(config)));

    // You can disable the url preload, in case we encounter a problem
    // with the new url service.
    if (options.disableUrlPreload) {
      return;
    }

    this.bind();

    // Hardcoded routes
    // @TODO figure out how to do this from channel or other config
    // @TODO get rid of name concept (for compat with sitemaps)
    UrlService.cacheRoute('/', {name: 'home'});

    // Register a listener for server-start o load all the known urls
    common.events.on('server:start', () => {
      debug('URL service, loading all URLS');
      this.loadResourceUrls();
    });
  }

  bind() {
    const eventHandlers = {
      add(model, resource) {
        UrlService.cacheResourceItem(resource, model.toJSON());
      },
      update(model, resource) {
        const newItem = model.toJSON();
        const oldItem = model.updatedAttributes();

        const oldUrl = resource
      }
    };
  }
}

module.exports = UrlService;
