'use strict';

// node core modules
const url = require('url');

// 3rd party modules
const _ = require('lodash');
const logger = require('oniyi-logger')('oniyi-http-plugin-format-url-template');

// internal modules
const { formatPath, formatQuery } = require('./utils');

const defaultPluginOptions = {
  applyToUrl: true,
  applyToQueryString: false,
  valuesMap: {
    authType: {
      oauth: 'oauth',
      basic: 'basic',
      saml: 'form',
      cookie: 'form',
    },
  },
};
};

/**
 * Used for applying authorization type to provided url. It is necessary to follow next pattern
 * while generating URI:
 *
 * http://baseUrl.com/ibmconnections/{authType}/extra/path
 *
 * where 'authType' gets replaced with desired authorization type.
 *
 * @param {Object}  [pluginOptionsArg.valuesMap]                  map templateValues to a custom value
 * @param {Boolean} [pluginOptionsArg.applyToUrl=true]            parse template strings in url parameter?
 * @param {Boolean} [pluginOptionsArg.applyToQueryString=false]   parse template strings in query parameter?
 * @example
 * // disables modifying request url
 * formatUrlTemplateFactory({ applyToUrl: false });
 * @example
 * // enables modifying request querystring
 * formatUrlTemplateFactory({ applyToQueryString: true });
 * @example
 * // provides custom values map for { authType } templateString
 * formatUrlTemplateFactory({ valuesMap: { authType: { oauth: 'oauth2' } } });
 * @return {*}
 */
const formatUrlTemplateFactory = (pluginOptionsArg = {}) => {
  const pluginOptions = _.merge({}, defaultPluginOptions, pluginOptionsArg);

  return {
    name: 'format-url-template',
    load: (req, requestOptions, callback) => {
      const { plugins: { formatUrlTemplate: pluginOptionsParam = {} } = {} } = requestOptions;
      const options = _.merge({}, pluginOptions, pluginOptionsParam);


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

module.exports = formatUrlTemplateFactory;
