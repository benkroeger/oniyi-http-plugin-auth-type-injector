'use strict';

// node core modules
const url = require('url');
const querystring = require('querystring');

// 3rd party modules
const _ = require('lodash');

// internal modules

const regex = /({\s?([0-9a-zA-Z_]+)\s?})/g;

/**
 * Validate value in order to determine if falsy value was given.
 * Returns true or false.
 *
 * @param {any} value   Value that is being validated
 */
const isFalsy = value => (value === 'false' ||
    value === 'NaN' ||
    value === '0' ||
    value === '' ||
    value === 'undefined' ||
    value === 'null');

/**
 * Formatting path with provided 'requestOptions'.
 * Using 'typeToNameMap' to look for custom mapping as a result from previous 'requestOptions' mapping.
 * Provided 'regex' extracts String template from given path and groups them into elements:
 *
 *  e.g.  path: '/{ authType }/foo/{bar}/test/path',
 *        requestOptions = { authType: 'saml', bar: 'itWorks' },
 *        typeToNameMap = { saml: 'saml2' }
 *
 * 'templateString' -> { authType }, {bar}
 * 'name' -> authType, bar
 *
 *  requestOptions[name] -> 'saml'
 *  typeToNameMap[requestOptions[name]] -> typeToNameMap['saml'] -> 'saml2'
 *
 * 'templateString' is left in the path by default intentionally for debugging purposes
 *
 * The result:
 *
 * /saml2/foo/itWorks/test/path
 *
 * @param {String} path                 Path that needs to be formatted
 * @param {Object} requestOptions       Options that hold mapping details required by formatting method
 * @param {Object} typeToNameMap        Options that hold mapping details required by formatting method
 */
const formatPath = (path, requestOptions, typeToNameMap) => path.replace(regex, (...args) => {
  const [, templateString, name] = args;
  const mappedName = requestOptions[name];
  if (isFalsy(mappedName)) {
    return '';
  }
  return typeToNameMap[mappedName] ? typeToNameMap[mappedName] : mappedName || templateString;
}).replace(/([^:]\/)\/+/g, '$1');

/**
 * Format query parameters object
 *
 * 1. querystring.stringify() transforms query object into String
 * 2. decodeURIComponent() decodes path provided from previous execution
 * 3. formatString() is responsible for template formatting
 * 4. querystring.parse() transforms formatted queryString into an object
 *
 * @param {Object} query                Query object that has {key: value} pairs
 * @param {Object} requestOptions       Options that hold mapping details required by formatting method
 * @param {Object} typeToNameMap        Options that hold mapping details required by formatting method
 */
const formatQuery = (query, requestOptions, typeToNameMap) =>
  querystring.parse(
    formatPath(
      decodeURI(
        querystring.stringify(query)
      ), requestOptions, typeToNameMap
    )
  );

/**
 * We need to extract uri path in order to assign appropriate authorization type.
 * String provided: make sure that we have full url, then return decoded path
 * Object provided: format url object (absolute path should be retrieved) and return decoded path
 *
 * We need decoding in case special characters are used and encoded in url.
 * e.g. require('url').resolve(baseUrl, path) encodes character '{' into '%7B', '<' into '%3C'...
 *
 * @param {String|Object} uri     uri derived from requested parameter.
 * @param {Function} callback     used to return response to the caller.
 * @return {*}
 */
const extractUriPath = (uri, callback) => {
  // we are interested only in absolute uri path
  if (_.isString(uri)) {
    if (/:?\/\//.test(uri)) {
      return callback(null, decodeURI(uri));
    }
    return callback(new Error(`uri must be an absolute path when it is of type "String", instead we got: [${uri}]`));
  }
  if (_.isObject(uri) && Object.getPrototypeOf(uri).constructor.name === 'Url') {
    const formattedUri = url.format(uri);
    return callback(null, decodeURI(formattedUri));
  }
  return callback(new TypeError(`uri must be of type "String" or Url-like "Object", instead we got: [${typeof uri}]`));
};

module.exports = {
  formatPath,
  formatQuery,
  extractUriPath,
};
