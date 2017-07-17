'use strict';

// node core modules
const querystring = require('querystring');

// 3rd party modules
const _ = require('lodash');

// internal modules

// regex setup
const templateStringRegex = /({\s?([0-9a-zA-Z_]+)\s?})/g;
const removeDoubleSlashesRegex = /([^:]\/)\/+/g;

const echo = arg => arg;

/**
 * Formatting template with provided 'templateValues'.
 * Using 'valuesMap' to look for custom mapping as a result from previous 'templateValues' mapping.
 * Provided 'regex' extracts String template from given template and groups them into elements:
 *
 *  e.g.  template: '/{ authType }/foo/{bar}/test/path',
 *        templateValues = { authType: 'saml', bar: 'itWorks' },
 *        valuesMap = { saml: 'saml2' }
 *
 * 'templateString' -> { authType }, {bar}
 * 'name' -> authType, bar
 *
 *  templateValues[name] -> 'saml'
 *  valuesMap[templateValues[name]] -> valuesMap['saml'] -> 'saml2'
 *
 * 'templateString' is left in the template by default intentionally for debugging purposes
 *
 * The result:
 *
 * /saml2/foo/itWorks/test/path
 *
 * @param {String} template                 Path that needs to be formatted
 * @param {Object} templateValues       Options that hold mapping details required by formatting method
 * @param {Object} valuesMap        Options that hold mapping details required by formatting method
 */
const renderTemplate = (template, templateValues = {}, valuesMap = {}) =>
  template.replace(templateStringRegex, (...args) => {
    const [, templateString, name] = args;
    /* beautify preserve:start */
    const { [name]: val } = templateValues;
    /* beautify preserve:end */

    if (_.isUndefined(val)) {
      return templateString;
    }

    /* beautify preserve:start */
    const { [name]: { [val]: mappedVal } = {} } = valuesMap;
    /* beautify preserve:end */

    return _.toString((!_.isUndefined(mappedVal) && mappedVal) || val);
  });

const formatHref = (href, templateValues, valuesMap) => {
  const template = decodeURI(href);

  return renderTemplate(template, templateValues, valuesMap)
  .replace(removeDoubleSlashesRegex, '$1');
};

/**
 * Format query parameters object
 *
 * 1. querystring.stringify() transforms query object into String
 * 3. formatString() is responsible for template formatting
 * 4. querystring.parse() transforms formatted queryString into an object
 *
 * @param {Object} query                Query object that has {key: value} pairs
 * @param {Object} templateValues       Options that hold mapping details required by formatting method
 * @param {Object} valuesMap        Options that hold mapping details required by formatting method
 */
const formatQuery = (query, templateValues, valuesMap) => {
  // tell querystring to not encode special characters while stringifying, since we rely on templateString syntax `{ myVar }`
  const template = querystring.stringify(query, null, null, { encodeURIComponent: echo });
  const formattedTemplate = renderTemplate(template, templateValues, valuesMap);
  // equally do not decode when parsing the string back in order to keep the level of encoding intact
  return querystring.parse(formattedTemplate, null, null, { decodeURIComponent: echo });
};

module.exports = {
  renderTemplate,
  formatQuery,
  formatHref,
};
