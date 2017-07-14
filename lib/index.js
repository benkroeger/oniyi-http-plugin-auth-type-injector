'use strict';

// node core modules
const url = require('url');

// 3rd party modules
const _ = require('lodash');
const logger = require('oniyi-logger')('oniyi-http-plugin-format-url-template');

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
      const origParams = _.assign({}, params);
      logger.debug('load: executing with {{params}} ', origParams);

      if (origParams.plugins && origParams.plugins.formatUrlTemplate) {
        formatUrlTemplateParams = _.merge({}, formatUrlTemplateParams, origParams.plugins.formatUrlTemplate);
      }

      const { applyToUrl, applyToQueryString } = formatUrlTemplateParams;
      const { uri, qs = {} } = origParams;

      if (applyToUrl && (_.isObject(uri) && Object.getPrototypeOf(uri).constructor.name === 'Url')) {
        _.assign(origParams, {
          uri: url.parse(
            formatPath(
              decodeURI(url.format(uri)), origParams, typeToNameMap)),
        });
      }
      if (applyToQueryString) {
        _.assign(origParams, {
          qs: formatQuery(qs, origParams, typeToNameMap),
        });
      }

      return callback(null, origParams);
    },
  };
};
