const supportedLocales = ['en', 'fa'];
const chalk = require('chalk');
const fse = require('fs-extra');
const MessageFormat = require('intl-messageformat');
const jp = require('jsonpath');
const {
  isEmpty,
  isEqual,
  isObject,
  isString,
} = require('lodash');
const path = require('path');
const settingsCache = require('../../services/settings/cache');
const {
  errors,
  events,
  logging
} = require('./index');

const _private = {};
// Dynamically based on overall settings (key = 'default_locale') in the
// settings db table.
// The corresponding translation files should be at:
//   content/themes/mytheme/locales/fa.json, etc.
let currentLocale;
let coreStrings;
let themeStrings;

const I18n = {
  /**
   * Helper method to find and compile the given data context with proper
   * string resource
   *
   * @param {string} path - Path with in the JSON language file to desired string (ie: 'errors.init.jsNotBuilt')
   * @param {object} bindings
   * @returns {string|Array<string>} @PULL_REQUEST
   */
  t(path, bindings) {
    let string, isTheme, msg;

    currentLocale = I18n.locale();
    if (bindings !== undefined) {
      isTheme = bindings.isThemeString;
      delete bindings.isThemeString;
    }
    string = I18n.findString(path, {isThemeString: isTheme});

    // If the path returns an array (as in the case with anything that has
    // multiple paragraphs such as emails), then loop through them and return
    // an array of translated/formatted strings. Otherwise, just return the
    // normal translated/formatted string.
    if (Array.isArray(string)) {
      msg = [];
      string.forEach(s => {
        let m = new MessageFormat(s, currentLocale);

        try {
          m.format(bindings);
        }
        catch (err) {
          logging.error(err.message);

          // fallback
          m = new MessageFormat(coreStrings.errors.errors.anErrorOccurred, currentLocale);
          m = m.format(); // @PULL_REQUEST
        }

        msg.push(m);
      });
    }
    else {
      msg = new MessageFormat(string, currentLocale);

      try {
        msg = msg.format(bindings);
      }
      catch (err) {
        logging.error(err.message);

        // fallback
        msg = new MessageFormat(coreStrings.errors.errors.anErrorOccurred, currentLocale);
        msg = msg.format();
      }
    }

    return msg;
  },

  /**
   * Parse JSON file for matching locale, returns string giving the supplied path
   *
   * @param {string}  msgPath - Path with in JSON language file to desired string (ie: 'errors.init.jsNotBuilt')
   * @param opts
   * @returns {string} @PULL_REQUEST
   */
  findString(msgPath, opts = {}) {
    const options = Object.assign({log: true}, opts);
    let candidateString;
    let matchingString;
    let path;

    // No path? no string
    if (isEmpty(msgPath) || !isString(msgPath)) {
      chalk.yellow('i18n.t() - received an empty path.');
      return '';
    }

    // If language file is not in memory, load translation file for core
    if (coreStrings === undefined) {
      I18n.init();
    }

    if (options.isThemeString) {
      // If not in memory, load translations for theme
      if (themeStrings === undefined) {
        I18n.loadThemeTranslations();
      }

      // both jsonpath's dot-notation and bracket notation start with '$'
      // E.g.: $.store.book.title or $['store']['book']['title']
      // The {{t}} translation helper passes the default English text
      // The full Unicode jsonpath with '$' is built here
      // jp.stringify and jp.value are jsonpath methods
      // Info: https://www.npmjs.com/package/jsonpath
      path = jp.stringify(['$', msgPath]);
      candidateString = jp.value(themeStrings, path) || msgPath;
    }
    else {
      // Backend messages use dot-notation, and the '$.' prefix is added here
      // while bracket-notation allows any Unicode characters in keys for themes,
      // dot-notation allows only word characters in keys for backend messages
      // (that is \w or [A-Za-z0-9_] in RegExp)
      path = '$.' + msgPath;
      candidateString = jp.value(coreStrings, path);
    }

    matchingString = candidateString || {};

    if (isObject(matchingString) || isEqual(matchingString, {})) {
      if (options.log) {
        logging.error(new errors.IncorrectUsageError({
          message: `i18n error: path "${msgPath} was not found`,
        }));
      }

      matchingString = coreStrings.errors.errors.anErrorOccurred;
    }

    // @FIXME: according to jsonpath docs, jp.value() only returns strings,
    // so to check for array results in the calling site(.t()) is not necessary
    // https://github.com/dchester/jsonpath
    return matchingString;
  },

  doesTranslationExists(msgPath) {
    const translation = I18n.findString(msgPath, {log: false});
    return translation !== coreStrings.errors.errors.anErrorOccurred;
  },

  /**
   * Setup i18n support:
   *   - Load proper language file into memory
   */
  init() {
    // This function is called during Nahang's initialization.
    // Reading translation file for message from core .js files and
    // keeping its content in memory
    // The English file is always loaded, until back-end translations are
    // enabled in future versions.
    coreStrings = fse.readFileSync(path.join(__dirname, '..', '..', 'translations', 'en.json'));

    // If translation file is not valid, you will see an error
    try {
      coreStrings = JSON.parse(coreStrings);
    }
    catch (err) {
      coreStrings = undefined;
      throw err;
    }

    _private.initializeIntl();
  },

  /**
   * Setup i18n support for themes:
   *   - Load proper language file into memory
   */
  loadThemeTranslations() {
    // This function is called during theme initialization, and when switching
    // language or theme.
    currentLocale = I18n.locale();

    // Reading translation file for theme .hbs templates.
    // Preventing missing files
    try {
      // @FIXME: configure translation path for views
      themeStrings = fse.readFileSync(
        path.join(__dirname, '..', '..', 'translations', 'themes', 'locals', `${currentLocale}.json`));
    }
    catch (err) {
      themeStrings = undefined;
      if (err.code === 'ENOENT') {
        logging.warn(`Theme's file locales ${currentLocale}.json not found.`);
      }
      else {
        throw err;
      }
    }

    if (themeStrings === undefined && currentLocale !== 'en') {
      logging.warn('Failing back to locales/en.json.');
      try {
        themeStrings = fse.readFileSync(path.join(__dirname, '..', '..', 'translations', 'themes', 'locales', 'en.json'));
      }
      catch (err) {
        themeStrings = undefined;
        if (err.code === 'ENOENT') {
          logging.warn('Theme\'s file locales/en.json not found.');
        }
        else {
          throw err;
        }
      }
    }

    if (themeStrings !== undefined) {
      // If translation file is not valid, you will see an error
      try {
        themeStrings = JSON.parse(themeStrings);
      }
      catch (err) {
        themeStrings = undefined;
        throw err;
      }
    }

    if (themeStrings === undefined) {
      // Even if empty, themeStrings must be an object for jp.value
      themeStrings = {};
    }

    _private.initializeIntl();
  },

  /**
   * Exporting the current locale (e.g. "en") to make it available for other
   * files as well.
   * such as core/server/helpers/data.js | core/server/helpers/lang.js
   */
  locale() {
    return settingsCache.get('default_locale');
  }
};

/**
 * Setup i18n support:
 *   - Polyfill node.js if it does not have Intl support or support for a particular locale
 */
_private.initializeIntl = function initializeIntl() {
  let hasBuiltinLocaleData;
  let IntlPolyfill;

  if (global.Intl) {
    // Determine if the built-in `Intl` has the locale data we need.
    hasBuiltinLocaleData = supportedLocales.every(locale =>
      Intl.NumberFormat.supportedLocalesOf(locale)[0] === locale &&
      Intl.DateTimeFormat.supportedLocalesOf(locale)[0] === locale
    );

    if (!hasBuiltinLocaleData) {
      // `Intl` exists, but it does not have the data we need, so load the
      // polyfill and replace the constructors we need with the polyfill's
      IntlPolyfill = require('intl');
      Intl.NumberFormat = IntlPolyfill.NumberFormat;
      Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
    }
  }
  else {
    // No `Intl`, so use and load the polyfill
    global.Intl = require('intl');
  }
};

module.exports = I18n;
