'use strict';

// node core modules
const url = require('url');

// 3rd party modules
const _ = require('lodash');
const mustache = require('mustache');
const logger = require('oniyi-logger')('oniyi-http-plugin-auth-type-injector');

// internal modules
const { extractUriPath, extractAuthType } = require('./util');

const defaultTypeToNameMap = {
  oauth: 'oauth',
  basic: 'basic',
  saml: 'form',
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
module.exports = function authTypeInjector(pluginOptions = {}) {
  const typeToNameMap = _.merge(defaultTypeToNameMap, pluginOptions.typeToNameMap);
  return {
    name: 'inject-auth-type',
    load: (req, origParams, callback) => {
      const { uri } = origParams;

      // use custom mapping logic to convert authorization type into required authorization name
      const authType = typeToNameMap[extractAuthType(origParams)] || '';
      const uriPath = extractUriPath(uri);

      // {uriPath} can be of type String or an Error. If it is not a string, notify caller
      if (!_.isString(uriPath)) {
        logger.debug('Error occurred after parsing uri path: ', uriPath);
        callback(uriPath);
        return;
      }

      if (/[{]{2}/.test(uriPath) && !/authType/.test(uriPath)) {
        logger.debug('Wrong template variable used in requested uri. {{authType}} not found in: [%s]', uriPath);
        callback(new Error('Wrong template variable used in requested uri. {{authType}} not found in: [%s]', uriPath));
        return;
      }
      // using 'mustache' to apply authType to uri
      // if authType no provided / not necessary, remove potentially extra slash
      const applyTemplateToUri = mustache.render(uriPath, { authType }).replace(/([^:]\/)\/+/g, '$1');
      const parsedUri = url.parse(applyTemplateToUri);

      // make sure to return parsed uri by overriding current one from 'origParams'
      callback(null, _.assign(origParams, { uri: parsedUri }));
    },
  };
};
