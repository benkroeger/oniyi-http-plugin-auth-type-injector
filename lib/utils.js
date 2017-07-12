'use strict';

// node core modules
const querystring = require('querystring');

// 3rd party modules
const _ = require('lodash');

// internal modules

// regex setup
const formatPathRegex = /({\s?([0-9a-zA-Z_]+)\s?})/g;
const removeDoubleSlashesRegex = /([^:]\/)\/+/g;

/**
 * Validate value in order to determine if falsy value was given.
 * Returns true or false.
 *
 * @param value   Value that is being validated
 */
const isFalsy = value => (_.isNaN(value) ||
    value === false ||
    value === 0 ||
    value === '' ||
    value === undefined ||
    value === null);

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
const formatPath = (path, requestOptions, typeToNameMap) => path.replace(formatPathRegex, (...args) => {
  const [, templateString, name] = args;
  const mappedName = requestOptions[name];
  if (isFalsy(mappedName)) {
    return '';
  }
  return typeToNameMap[mappedName] ? typeToNameMap[mappedName] : mappedName || templateString;
}).replace(removeDoubleSlashesRegex, '$1');

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

module.exports = {
  formatPath,
  formatQuery,
};
