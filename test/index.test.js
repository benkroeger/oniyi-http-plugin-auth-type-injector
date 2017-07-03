'use strict';

// node core modules
const url = require('url');

// 3rd party modules
const test = require('ava');
const _ = require('lodash');

// internal modules
const formatUrlTemplate = require('../lib');

const regex = /({\s?([0-9a-zA-Z_]+)\s?})/;

test.beforeEach((t) => {
  const typeToNameMap = {
    oauth: 'oauth2',
    basic: 'BASIC',
    saml: 'saml3',
  };

  const initPlugin = formatUrlTemplate();
  const { load } = initPlugin;

  function getValues(obj) {
    return Object.keys(obj).map(key => obj[key]);
  }

  // uri variables
  const uri = url.parse('https://apps.na.collabserv.com/files/{ authType }/api/feed');
  const uriString = 'https://apps.na.collabserv.com/files/{ authType }/api/{ mockParam }/feed';
  const uriTemplateCombination = url.parse('https://apps.na.collabserv.com/files/{ authType }/api/{ mockParam }/feed');

  const noAuthTypeTemplate = url.parse('https://apps.na.collabserv.com/files/api/feed');
  const wrongTemplateUrl = url.parse('https://apps.na.collabserv.com/files/{ badAuthType }/api/feed');

  // query string variables
  const qs = {
    userid: '{mockParam}',
  };
  const multipleQs = {
    userid2: '{ mockUserid2 }',
    userid3: '{mockUserid3}',
  };

  const qsNoTemplate = {
    userid: 'userid',
  };

  _.assign(t.context, {
    load,
    getValues,
    typeToNameMap,
    uri,
    uriString,
    uriTemplateCombination,
    noAuthTypeTemplate,
    wrongTemplateUrl,
    qs,
    qsNoTemplate,
    multipleQs,
  });
});

/* Metadata test */
test('validate {formatUrlTemplate} values and type', (t) => {
  t.true(_.isObject(formatUrlTemplate()));
  const { name, load } = formatUrlTemplate();

  t.true(_.isString(name));
  t.true(_.isFunction(load));

  t.is(name, 'inject-auth-type');
  t.is(load.length, 3, 'there should be 3 arguments in {load} function');
});

/* Successful scenarios validations */
test.cb('validation when { authType } is provided, url given as Url "Object", authType: "basic"', (t) => {
  const { load, uri } = t.context;
  const params = {
    uri,
    authType: 'basic',
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = params;
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes('basic'), `"basic" should be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('validation when {authType } and { test} template provided, "qs" { test } template provided, url given as "String", authType: "basic"', (t) => {
  const { load, uriString, qs } = t.context;
  const params = {
    qs,
    uri: uriString,
    authType: 'basic',
    mockParam: 'injectedMockParam',
    applyToQueryString: true,
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: originalPath }, authType, mockParam, qs: originalQs } = params;
    const { uri: { href: modifiedPath }, qs: modifiedQs } = modifiedParams;

    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalQs, modifiedQs, `original query string should be different from modified query string.
      original: {${originalQs.userid}}, modified: {${modifiedQs.userid}}`);
    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);

    [authType, mockParam].forEach(elem =>
      t.true(modifiedPath.includes(elem), `${elem} should be part of modified path. provided: {${modifiedPath}}`));
    t.end();
  });
});

test.cb('validation when {userid2} && {userid3} template provided, multiple "qs" templates provided', (t) => {
  const { uri, typeToNameMap, multipleQs } = t.context;
  const { load } = formatUrlTemplate({ typeToNameMap });

  const params = {
    uri,
    qs: multipleQs,
    applyToQueryString: true,
    mockUserid2: 'mappedMockedUserid2',
    mockUserid3: 'mappedMockedUserid3',
    authType: 'basic',
  };

  load(null, params, (err, modifiedParams) => {
    const { getValues } = t.context;
    const { qs } = modifiedParams;

    getValues(multipleQs).forEach((templateValue) => {
      const [, , value] = templateValue.match(regex);
      const mappedValue = params[value];
      t.true(Object.keys(qs).some(key => qs[key] === mappedValue), `{${mappedValue}} should be one of the values of {modifiedParams}`);
    });

    t.end();
  });
});

test.cb('validation when {authType} is provided, url given as "Object", authType: "basic", typeToNameMap matches requirements', (t) => {
  const { uri, typeToNameMap } = t.context;
  const { load } = formatUrlTemplate({ typeToNameMap });

  const params = {
    uri,
    authType: 'basic',
  };

  load(null, params, (err, modifiedParams) => {
    const { uri: { href: originalPath }, authType } = params;
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes(typeToNameMap[authType]), `${typeToNameMap[authType]} should be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

/* Error / Wrong input scenarios validations */

test.cb('validation when { authType } is not provided in url template, url given as Url "Object", authType: "basic"', (t) => {
  const { load, noAuthTypeTemplate: uri } = t.context;
  const params = {
    uri,
    authType: 'basic',
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = params;
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));
    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.false(modifiedPath.includes('basic'), `"basic" should not be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('validation when wrong { authType } is provided as url template, url given as Url "Object", authType: "basic"', (t) => {
  const { load, wrongTemplateUrl: uri } = t.context;
  const params = {
    uri,
    authType: 'basic',
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = params;
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.false(modifiedPath.includes('basic'), `"basic" should not be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('validation when "qs" is not provided', (t) => {
  const { load, uri } = t.context;
  const params = {
    uri,
    applyToQueryString: true,
    mockTemplate: 'mockMappedTemplate',
  };
  load(null, params, (err, modifiedParams) => {
    t.true('qs' in modifiedParams, '"qs" should be a member of {modifiedParams} when "applyToQueryString" is set to true');
    const { qs } = modifiedParams;

    t.true(_.isObject(qs), '"qs" should be an Object');
    t.end();
  });
});

test.cb('validation when no "qs" template is provided', (t) => {
  const { load, uri, qsNoTemplate } = t.context;
  const params = {
    uri,
    applyToQueryString: true,
    qs: qsNoTemplate,
    mockTemplate: 'mockMappedTemplate',
  };
  load(null, params, (err, modifiedParams) => {
    const { qs: originalQs } = params;
    const { qs: modifiedQs } = modifiedParams;

    t.deepEqual(originalQs, modifiedQs, `original query string should be different from modified query string.
      original: {${originalQs.userid}}, modified: {${modifiedQs.userid}}`);
    t.end();
  });
});

test.cb('validation when wrong "qs" template is provided', (t) => {
  const { load, uri, qs } = t.context;
  const params = {
    uri,
    qs,
    applyToQueryString: true,
    wrongQsTemplate: 'mockTemplate',
  };
  load(null, params, (err, modifiedParams) => {
    const { qs: originalQs } = params;
    const { qs: modifiedQs } = modifiedParams;
    t.deepEqual(originalQs, modifiedQs, `original query string should be different from modified query string.
      original: {${originalQs.userid}}, modified: {${modifiedQs.userid}}`);
    t.end();
  });
});

test.cb('validation when "authType" is not provided', (t) => {
  const { load, uri } = t.context;
  const params = {
    uri,
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = params;
    const { uri: { href: modifiedPath } } = modifiedParams;

    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);

    t.end();
  });
});

test.cb('validation when "applyToUrl" is set to false', (t) => {
  const { load, uri } = t.context;
  const params = {
    uri,
    applyToUrl: false,
    authType: 'oauth',
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = params;
    const { uri: { href: modifiedPath } } = modifiedParams;

    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);

    t.end();
  });
});

test.cb('error validation when uri is not provided', (t) => {
  const { load } = t.context;
  const params = {
    authType: 'oauth',
  };
  load(null, params, (err) => {
    t.is(err.message, `uri must be of type "String" or Url-like "Object", instead we got: [${typeof params.uri}]`);
    t.is(err.name, 'TypeError');

    t.end();
  });
});

test.cb('error validation when uri is provided as non-Url "Object"', (t) => {
  const { load } = t.context;
  const params = {
    authType: 'oauth',
    uri: new Date(),
  };
  load(null, params, (err) => {
    t.is(err.message, `uri must be of type "String" or Url-like "Object", instead we got: [${typeof params.uri}]`);
    t.is(err.name, 'TypeError');

    t.end();
  });
});

test.cb('error validation when url as "String" is provided as non-absolute path', (t) => {
  const { load, uri: { path: originalPath } } = t.context;
  const params = {
    uri: originalPath,
  };

  load(null, params, (err) => {
    t.is(err.message, `uri must be an absolute path when it is of type "String", instead we got: [${originalPath}]`);
    t.is(err.name, 'Error');
    t.end();
  });
});

test.cb('validate "authType" provided with falsy value', (t) => {
  const { load, uri } = t.context;
  const params = {
    uri,
    authType: '',
  };

  load(null, params, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = params;
    const { uri: { href: modifiedPath } } = modifiedParams;

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.falsy(modifiedPath.match(/([^:]\/)\/+/g), `modified path: {${modifiedPath}} should not contain double slashes`);
    t.falsy(modifiedPath.match(/(authType)/, `modified path: {${modifiedPath}} should not contain "authType" when falsy value provided`));
    t.end();
  });
});

