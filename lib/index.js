'use strict';

// node core modules
const url = require('url');

// 3rd party modules
const _ = require('lodash');
const logger = require('oniyi-logger')('oniyi:http-plugin:format-url-template');

// internal modules
const { formatHref, formatQuery } = require('./utils');

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

const processUri = (requestOptions, { applyToUrl, valuesMap }) => {
  const { uri } = requestOptions;
  if (!applyToUrl) {
    return uri;
  }
  const href = (_.isString(uri) && uri) || uri.href;

  const formattedHref = formatHref(href, requestOptions, valuesMap);

  // automatically escapes characters for us (https://nodejs.org/dist/latest-v6.x/docs/api/url.html#url_escaped_characters)
  return url.parse(formattedHref);
};

const processQuerystring = (requestOptions, { applyToQueryString, valuesMap }) => {
  const { qs } = requestOptions;
  if (!applyToQueryString) {
    return qs;
  }
  return formatQuery(qs, requestOptions, valuesMap);
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

      const uri = processUri(requestOptions, options);
      const qs = processQuerystring(requestOptions, options);


      return callback(null, Object.assign({}, requestOptions, { uri, qs }));
    },
  };
};

module.exports = formatUrlTemplateFactory;
