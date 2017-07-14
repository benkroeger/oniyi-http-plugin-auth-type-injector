'use strict';

// node core modules
const url = require('url');

// 3rd party modules
const _ = require('lodash');
const logger = require('oniyi-logger')('oniyi-http-plugin-format-url-template');
const async = require('async');

// internal modules
const { formatPath, formatQuery } = require('./utils');

const defaultTypeToNameMap = {
  oauth: 'oauth',
  basic: 'basic',
  saml: 'form',
  cookies: 'form',
};

const defaultFormatUrlTemplateParams = {
  applyToUrl: true,
  applyToQueryString: false,
};

/**
 * Used for applying authorization type to provided url. It is necessary to follow next pattern
 * while generating URI:
 *
 * http://baseUrl.com/ibmconnections/{authType}/extra/path
 *
 * where 'authType' gets replaced with desired authorization type.
 *
 * @param pluginOptions.typeToNameMap         Contains information about authorization type mapping and overrides the default one
 * @param pluginOptions.formatUrlTemplate     Contains information about formatting options and overrides the default one
 * @return {*}
 */
module.exports = function formatUrlTemplateFactory(pluginOptions = {}) {
  const typeToNameMap = _.merge({}, defaultTypeToNameMap, pluginOptions.typeToNameMap);
  let formatUrlTemplateParams = _.merge({}, defaultFormatUrlTemplateParams, pluginOptions.formatUrlTemplate);

  return {
    name: 'format-url-template',
    load: (req, params, callback) => {
      logger.debug('load: executing with {{params}} ', params);

      if (params.plugins && params.plugins.formatUrlTemplate) {
        formatUrlTemplateParams = _.merge({}, formatUrlTemplateParams, params.plugins.formatUrlTemplate);
      }

      const { applyToUrl, applyToQueryString } = formatUrlTemplateParams;
      const { uri, qs = {} } = params;

      async.parallel([
        (done) => { // eslint-disable-line consistent-return
          if (!applyToUrl || !(_.isObject(uri) && Object.getPrototypeOf(uri).constructor.name === 'Url')) {
            logger.debug(`Skipping formatting uri object.
             Uri object provided: [${Object.getPrototypeOf(uri).constructor.name}]
             plugins.formatUrlTemplate.applyToUrl: [${applyToUrl}]`);
            return done(null, uri);
          }
          const decodedUri = decodeURI(url.format(uri));
          return done(null,
            url.parse(
              formatPath(decodedUri, params, typeToNameMap)
            )
          );
        },
        (done) => {
          if (!applyToQueryString) {
            logger.debug(`Skipping formatting qs object.
             plugins.formatUrlTemplate.applyToQueryString: [${applyToQueryString}]`);
            return done(null, qs);
          }
          return done(null, formatQuery(qs, params, typeToNameMap));
        },
      ], (err, [uri, qs]) => callback(err, _.assign({}, params, { uri, qs }))); // eslint-disable-line no-shadow
    },
  };
};
