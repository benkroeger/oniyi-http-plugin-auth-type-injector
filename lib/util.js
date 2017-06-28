'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules

const regexAuth = /^Bearer\s(.+)/;
const regexBasic = /^Basic\s(.+)/;

/**
 * Validates Authorization string in order to determine authorization type.
 *
 * @param {String} regexExpression    Regular expression used for testing authorization string
 * @param {Object} headers            Headers object provided by request params
 * @return {*}
 */
const headerAuth = (regexExpression, headers) => {
  const { Authorization: authString } = headers;
  return authString ? regexExpression.test(authString) : false;
};

/**
 * Method used for determining authorization type based on provided options.
 *
 * @param {Object} params     Params object that holds information about current http request
 * @return {*}
 */
const extractAuthType = (params) => {
  const { headers = {}, auth = {}, jar } = params;
  if (_.isString(auth.bearer) || headerAuth(regexAuth, headers)) {
    return 'oauth';
  }

  const { username, password } = auth;
  if ((username && password) || headerAuth(regexBasic, headers)) {
    return 'basic';
  }

  if (jar) {
    return 'saml';
  }

  return '';
};

/**
 * We need to extract uri path in order to assign appropriate authorization type.
 * String provided: make sure that we have full url, then return decoded path
 * Object provided: extract {{ href }} property and return decoded path
 *
 * We need decoding in case special characters are used and encoded in url.
 * e.g. require('url').resolve(baseUrl, path) encodes character '{' into '%7B', '<' into '%3C'...
 *
 * @param {String|Object} uri     uri derived from requested parameter.
 * @return {*}
 */
const extractUriPath = (uri) => {
  // we are interested only in absolute uri path
  if (_.isString(uri)) {
    if (/:?\/\//.test(uri)) {
      return decodeURIComponent(uri);
    }
    return new Error(`uri must be an absolute path when it is of type "String", instead we got: [${uri}]`);
  }
  if (_.isObject(uri)) {
    const { href } = uri;
    if (href) {
      return decodeURIComponent(href);
    }
    return new Error('uri.href must be defined');
  }
  return new TypeError(`uri must be of type "String" or "Object", instead we got: [${typeof uri}]`);
};

module.exports = {
  extractAuthType,
  extractUriPath,
};
