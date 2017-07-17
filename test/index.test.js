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
  const valuesMap = {
    authType: {
      oauth: 'oauth2',
      basic: 'BASIC',
      saml: 'saml3',
    },
  };

  const initPlugin = formatUrlTemplate();
  const { load } = initPlugin;

  function getValues(obj) {
    return Object.keys(obj).map(key => obj[key]);
  }

  // uri variables
  const uri = url.parse('https://apps.na.collabserv.com/files/{ authType }/api/feed');
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
    valuesMap,
    uri,
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

  t.is(name, 'format-url-template');
  t.is(load.length, 3, 'there should be 3 arguments in {load} function');
});

/* Successful scenarios validations */
test.cb('validation when { authType } is provided, authType: "basic"', (t) => {
  const { load, uri } = t.context;
  const requestOptions = {
    uri,
    authType: 'basic',
  };
  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(requestOptions).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes('basic'), `"basic" should be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('validation when {userid2} && {userid3} template provided, multiple "qs" templates provided', (t) => {
  const { uri, valuesMap, multipleQs } = t.context;
  const { load } = formatUrlTemplate({ valuesMap });

  const requestOptions = {
    uri,
    qs: multipleQs,
    plugins: {
      formatUrlTemplate: {
        applyToQueryString: true,
      },
    },
    mockUserid2: 'mappedMockedUserid2',
    mockUserid3: 'mappedMockedUserid3',
    authType: 'basic',
  };

  load(null, requestOptions, (err, modifiedParams) => {
    const { getValues } = t.context;
    const { qs } = modifiedParams;

    getValues(multipleQs).forEach((templateValue) => {
      const [, , value] = templateValue.match(regex);
      const mappedValue = requestOptions[value];
      t.true(Object.keys(qs).some(key => qs[key] === mappedValue), `{${mappedValue}} should be one of the values of {modifiedParams}`);
    });

    t.end();
  });
});

test.cb('validation when {authType} is provided, authType: "basic", valuesMap matches requirements', (t) => {
  const { uri, valuesMap } = t.context;
  const { load } = formatUrlTemplate({ valuesMap });

  const requestOptions = {
    uri,
    authType: 'basic',
  };

  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath }, authType } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(requestOptions).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes(valuesMap.authType[authType]), `${valuesMap.authType[authType]} should be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('validation when {authType} && {mockParam} are provided, authType: "oauth"', (t) => {
  const { load, uriTemplateCombination } = t.context;

  const requestOptions = {
    uri: uriTemplateCombination,
    authType: 'oauth',
    mockParam: 'customPath',
  };

  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath }, authType, mockParam } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(requestOptions).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes(authType), `${authType} should be part of modified path. provided: {${modifiedPath}}`);
    t.true(modifiedPath.includes(mockParam), `${mockParam} should be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('validation when "applyToUrl" is set to false, "applyToQueryString" is set to true', (t) => {
  const { load, uri, qs: qsOriginal } = t.context;
  const requestOptions = {
    uri,
    qs: qsOriginal,
    plugins: {
      formatUrlTemplate: {
        applyToUrl: false,
        applyToQueryString: true,
      },
    },
    authType: 'oauth',
    mockParam: 'customQsPath',
  };
  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath }, mockParam } = requestOptions;
    const { uri: { href: modifiedPath }, qs } = modifiedParams;

    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.is(qs.userid, mockParam, `{qs.userid} ${qs.userid} should be equal to {requestOptions.mockParam} ${mockParam}`);
    t.end();
  });
});

test.cb('validation when "applyToUrl" is set via "pluginOptions"', (t) => {
  const { uri } = t.context;
  const { load } = formatUrlTemplate({
    applyToUrl: false,
  });
  const requestOptions = {
    uri,
    authType: 'oauth',
  };
  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath }, authType } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.not(modifiedPath.includes(authType), `{authType} ${authType} should not be injected in url. provided: ${modifiedPath}`);
    t.end();
  });
});

test.cb('validation when "applyToUrl" is set via both "pluginOptions" and "requestOptions"', (t) => {
  const { uri } = t.context;
  const { load } = formatUrlTemplate({
    formatUrlTemplate: {
      applyToUrl: false,
    },
  });

  // 'applyToUrl' set via requestOptions should have advantage over the initialized one
  const requestOptions = {
    uri,
    plugins: {
      formatUrlTemplate: {
        applyToUrl: true,
      },
    },
    authType: 'oauth',
  };

  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath }, authType } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.not(modifiedPath.includes(authType), `{authType} ${authType} should not be injected in url. provided: ${modifiedPath}`);

    t.end();
  });
});

/* Error / Wrong input scenarios validations */

test.cb('validation when { authType } is not provided in url template, authType: "basic"', (t) => {
  const { load, noAuthTypeTemplate: uri } = t.context;
  const requestOptions = {
    uri,
    authType: 'basic',
  };
  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(requestOptions).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));
    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.false(modifiedPath.includes('basic'), `"basic" should not be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('validation when wrong { authType } is provided as url template, authType: "basic"', (t) => {
  const { load, wrongTemplateUrl: uri } = t.context;
  const requestOptions = {
    uri,
    authType: 'basic',
  };
  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(requestOptions).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.false(modifiedPath.includes('basic'), `"basic" should not be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('validation when no "qs" template is provided', (t) => {
  const { load, uri, qsNoTemplate } = t.context;
  const requestOptions = {
    uri,
    plugins: {
      formatUrlTemplate: {
        applyToQueryString: true,
      },
    },
    qs: qsNoTemplate,
    mockTemplate: 'mockMappedTemplate',
  };
  load(null, requestOptions, (err, modifiedParams) => {
    const { qs: originalQs } = requestOptions;
    const { qs: modifiedQs } = modifiedParams;

    t.deepEqual(originalQs, modifiedQs, `original query string should be different from modified query string.
      original: {${originalQs.userid}}, modified: {${modifiedQs.userid}}`);
    t.end();
  });
});

test.cb('validation when wrong "qs" template is provided', (t) => {
  const { load, uri, qs } = t.context;
  const requestOptions = {
    uri,
    qs,
    plugins: {
      formatUrlTemplate: {
        applyToQueryString: true,
      },
    },
    wrongQsTemplate: 'mockTemplate',
  };
  load(null, requestOptions, (err, modifiedParams) => {
    const { qs: originalQs } = requestOptions;
    const { qs: modifiedQs } = modifiedParams;
    t.deepEqual(originalQs, modifiedQs, `original query string should be different from modified query string.
      original: {${originalQs.userid}}, modified: {${modifiedQs.userid}}`);
    t.end();
  });
});

test.cb('validation when "applyToUrl" is set to false', (t) => {
  const { load, uri } = t.context;
  const requestOptions = {
    uri,
    plugins: {
      formatUrlTemplate: {
        applyToUrl: false,
      },
    },
    authType: 'oauth',
  };
  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);

    t.end();
  });
});

test.cb('validate when "authType" provided with an empty string', (t) => {
  const { load, uri } = t.context;
  const requestOptions = {
    uri,
    authType: '',
  };

  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.falsy(modifiedPath.match(/([^:]\/)\/+/g), `modified path: {${modifiedPath}} should not contain double slashes`);
    t.falsy(modifiedPath.match(/(authType)/, `modified path: {${modifiedPath}} should not contain "authType" when an empty string is provided`));
    t.end();
  });
});

test.cb('validate when "authType" is equal to undefined / not present', (t) => {
  const { load, uri } = t.context;
  const requestOptions = {
    uri,
    authType: undefined,
  };

  load(null, requestOptions, (err, modifiedParams) => {
    const { uri: { href: originalPath } } = requestOptions;
    const { uri: { href: modifiedPath } } = modifiedParams;

    t.is(originalPath, modifiedPath, `original uri path should not be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes('authType'),
      `modified path: {${modifiedPath}} should contain "authType" when authType param is undefined / not provided`);
    t.end();
  });
});
