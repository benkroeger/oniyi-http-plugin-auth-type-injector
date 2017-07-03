'use strict';

// node core modules
const url = require('url');

// 3rd party modules
const _ = require('lodash');
const logger = require('oniyi-logger')('oniyi-http-plugin-format-url-template');

// internal modules
const { extractUriPath, formatPath, formatQuery } = require('./utils');

const defaultTypeToNameMap = {
  oauth: 'oauth',
  basic: 'basic',
  saml: 'form',
  cookies: 'form',
};

/**
 * Used for applying authorization type to provided url. It is necessary to follow next pattern
 * while generating URI:
 *
 * http://baseUrl.com/ibmconnections/{{authType}}/extra/path
 *
 * where 'authType' gets replaced with desired authorization type.
 *
 * @param pluginOptions.typeToNameMap     Contains information about authorization type mapping and overrides the default one
 * @return {*}
 */
module.exports = function formatUrlTemplate(pluginOptions = {}) {
  const typeToNameMap = _.merge({}, defaultTypeToNameMap, pluginOptions.typeToNameMap);
  return {
    name: 'inject-auth-type',
    load: (req, origParams, callback) => {
      logger.debug('load: executing with {{origParams}} ', origParams);
      const modifiedParams = _.assign({}, origParams);
      const { uri, applyToUrl = true, applyToQueryString, qs = {} } = modifiedParams;

      // extract uriPath from provided {uri} object
      const uriPath = extractUriPath(uri, (err, formattedUri) => {
        if (err) {
          return callback(err);
        }
        return formattedUri;
      });

      // if callback was called with an error, need to stop executing load() function immediately
      // TODO: find a better way of stopping an execution of outer (load) function
      if (!uriPath) {
        return;
      }

      // since formatPath() returns a formatted String url, need to parse it in order to get an Url object
      modifiedParams.uri = applyToUrl ? url.parse(formatPath(uriPath, origParams, typeToNameMap)) : modifiedParams.uri;

      // modify query parameters if required
      modifiedParams.qs = applyToQueryString ? formatQuery(qs, origParams, typeToNameMap) : modifiedParams.qs;

      // make sure to return parsed uri by overriding current one from 'origParams'
      callback(null, modifiedParams);
    },
  };
};
