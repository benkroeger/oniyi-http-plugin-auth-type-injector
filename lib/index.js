'use strict';

// node core modules
const url = require('url');

// 3rd party modules
const _ = require('lodash');
const debug = require('debug')('oniyi:http-client:plugin:format-url-template');

// internal modules
const { formatHref, formatQuery } = require('./utils');

const PHASE_NAME = 'format-url-template';

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
  if (!(applyToUrl && uri)) {
    return uri;
  }

  // provided uri can be either String or an Object
  const isUriString = _.isString(uri);

  const formattedHref = formatHref(isUriString ? uri : uri.href, requestOptions, valuesMap);

  return isUriString ? formattedHref : url.parse(formattedHref);
};

const processQuerystring = (requestOptions, { applyToQueryString, valuesMap }) => {
  const { qs } = requestOptions;
  if (!applyToQueryString || !qs) {
    return qs;
  }
  return formatQuery(qs, requestOptions, valuesMap);
};

/**
 * Replace templateStrings in your requestOptions's `uri` and `qs` with values extracted from other
 * properties in `requestOptions`
 *
 * @param {Object}  [params]                            the plugin params
 * @param {Object}  [params.valuesMap]                  map templateValues to a custom value
 * @param {Boolean} [params.applyToUrl=true]            parse template strings in url parameter?
 * @param {Boolean} [params.applyToQueryString=false]   parse template strings in query parameter?
 * @example
 * // disables modifying request url
 * pluginFactory({ applyToUrl: false });
 * @example
 * // enables modifying request querystring
 * pluginFactory({ applyToQueryString: true });
 * @example
 * // provides custom values map for { authType } templateString
 * pluginFactory({ valuesMap: { authType: { oauth: 'oauth2' } } });
 * @return {*}
 */
const pluginFactory = (params = {}) => {
  const pluginOptions = _.merge({}, defaultPluginOptions, params);
  debug('Plugin options compiled: %o', pluginOptions);

  return {
    name: PHASE_NAME,
    onRequest: [{
      phaseName: PHASE_NAME,
      handler: (ctx, next) => {
        const { options: requestOptions } = ctx;
        const {
          plugins: {
            formatUrlTemplate,
          } = {},
        } = requestOptions;
        const options = _.merge({}, pluginOptions, formatUrlTemplate);

        const uri = processUri(requestOptions, options);
        debug('request options uri updated: %o', uri);

        const qs = processQuerystring(requestOptions, options);
        debug('request options qs updated: %o', qs);

        // update the context with latest changes of request options
        _.assign(ctx, { options: _.assign({}, requestOptions, { uri, qs }) });

        next();
      },
    }],
  };
};

module.exports = pluginFactory;
