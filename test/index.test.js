'use strict';

// node core modules

// 3rd party modules
const test = require('ava');
const _ = require('lodash');

// internal modules
const authTypePlugin = require('../lib');

test.beforeEach((t) => {
  const typeToNameMap = { oauth: 'myOwnAuth' };
  const initPlugin = authTypePlugin();
  const { load } = initPlugin;

  // init mock params
  const uri = {
    host: 'fakeHost.com',
    href: 'https://fakeHost.com/this/{{authType}}/is/fake',
    path: '/this/{{authType}}/is/fake',
  };
  const uriEncoded = {
    host: 'fakeHost.com',
    href: 'https://fakeHost.com/this/%7B%7BauthType%7D%7D/is/fake',
    path: '/this/%7B%7BauthType%7D%7D/is/fake',
  };
  const uriHelper = {
    absolutePath: 'https://fakeHost.com/this/{{authType}}/is/fake',
    encodedPath: 'https://fakeHost.com/this/%7B%7BauthType%7D%7D/is/fake',
    badTagsPath: 'https://fakeHost.com/this/{{authType}/is/fake',
    badAuthTypePath: 'https://fakeHost.com/this/{{badAuthType}}/is/fake',
    noAuthTypePath: 'https://fakehost.com/this/is/fake',
  };

  const authBearer = {
    bearer: 'fake token',
  };
  const authBasic = {
    username: 'fake username',
    password: 'fake password',
  };
  const headerBearer = {
    Authorization: 'Bearer 12345',
  };
  const headerBasic = {
    Authorization: 'Basic 54321',
  };
  const jar = {
    jar: 'mock jar',
  };
  _.assign(t.context, {
    typeToNameMap,
    load,
    uri,
    uriHelper,
    uriEncoded,
    authBearer,
    authBasic,
    headerBearer,
    headerBasic,
    jar,
  });
});

/* Metadata test */
test('validate {authTypePlugin} values and type', (t) => {
  t.true(_.isObject(authTypePlugin()));
  const { name, load } = authTypePlugin();

  t.true(_.isString(name));
  t.true(_.isFunction(load));

  t.is(name, 'inject-auth-type');
  t.is(load.length, 3, 'there should be 3 arguments in {load} function');
});

/* Successful scenarios validations */
test.cb('validation when {{authType}} is provided, url given as "String", auth / bearer provided', (t) => {
  const { load, uriHelper: { absolutePath: originalPath }, authBearer } = t.context;
  const params = {
    uri: originalPath,
    auth: authBearer,
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes('oauth'), `"oauth" should be part of modified path. provided: {${modifiedPath}}`);

    t.end();
  });
});

test.cb('validation when {{authType}} is provided, url given as "Object", auth / username & password provided', (t) => {
  const { load, uri, authBasic } = t.context;
  const params = {
    uri,
    auth: authBasic,
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;
    const { href: originalPath } = uri;

    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `original uri path should be different from modified path.
      original: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes('basic'), `"basic" should be part of modified path. provided: {${modifiedPath}}`);

    t.end();
  });
});

test.cb('validation when encoded url given as "String" && headers / Bearer authorization are provided', (t) => {
  const { load, uriHelper: { encodedPath }, headerBearer } = t.context;
  const params = {
    uri: encodedPath,
    headers: headerBearer,
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;

    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(encodedPath, modifiedPath, `encoded uri path should be different from modified path.
      encoded: {${encodedPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes('oauth'), `"oauth" should be part of modified path. provided: {${modifiedPath}}`);

    t.end();
  });
});

test.cb('validation when encoded url given as "Object" && headers / Basic authorization are provided', (t) => {
  const { load, uriEncoded, headerBasic } = t.context;
  const params = {
    uri: uriEncoded,
    headers: headerBasic,
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;
    const { href: encodedPath } = uriEncoded;
    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(encodedPath, modifiedPath, `encoded uri path should be different from modified path.
      encoded: {${encodedPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes('basic'), `"basic" should be part of modified path. provided: {${modifiedPath}}`);

    t.end();
  });
});

test.cb('validation when url given as "String" && jar (saml) authorization are provided', (t) => {
  const { load, uriHelper: { absolutePath: originalPath }, jar } = t.context;
  const params = {
    uri: originalPath,
    jar,
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;
    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `originalPath uri path should be different from modified path.
      originalPath: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes('form'), `"form" should be part of modified path. provided: {${modifiedPath}}`);

    t.end();
  });
});

test.cb('validation when url given as "String" && auth / Bearer Authorization && {{pluginOptions.typeToNameMap}} are provided', (t) => {
  const { uriHelper: { absolutePath: originalPath }, authBearer, typeToNameMap } = t.context;
  const params = {
    uri: originalPath,
    auth: authBearer,
  };

  const initPlugin = authTypePlugin({ typeToNameMap });
  initPlugin.load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;
    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `originalPath uri path should be different from modified path.
      originalPath: {${originalPath}}, modified: {${modifiedPath}}`);
    t.true(modifiedPath.includes(typeToNameMap.oauth), `${typeToNameMap.oauth} should be part of modified path. provided: {${modifiedPath}}`);

    t.end();
  });
});

/* Error / Bad input scenarios validations */
test.cb('error validation when {{badAuthType}} && auth / Bearer is provided', (t) => {
  const { load, uriHelper: { badAuthTypePath: originalPath }, authBearer } = t.context;
  const params = {
    uri: originalPath,
    auth: authBearer,
  };

  load(null, params, (err) => {
    t.is(err.name, 'Error');
    t.is(err.message, `Wrong template variable used in requested uri. {{authType}} not found in: [${originalPath}]`);
    t.end();
  });
});

test.cb('error validation when {{authType}} is provided without any "authentication"', (t) => {
  const { load, uriHelper: { absolutePath: originalPath } } = t.context;
  const params = {
    uri: originalPath,
  };
  load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;
    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `originalPath uri path should be different from modified path.
      originalPath: {${originalPath}}, modified: {${modifiedPath}}`);
    t.false(modifiedPath.includes('oauth'), `"oauth" should not be part of modified path. provided: {${modifiedPath}}`);

    // when authentication is not provided, value of {{authType}} is set to '' by default, which may leave url as -> 'this/is//fake/path'
    // Need to make sure that this does not happen.
    t.false(/([^:]\/)\/+/g.test(modifiedPath), 'there should be no double-slashes in modified path');
    t.end();
  });
});

test.cb('error validation when url as "String" / "Object" not provided', (t) => {
  const { load } = t.context;
  const params = {
    uri: 42, // wrong type (and answer to everything)
  };

  load(null, params, (err) => {
    t.is(err.message, `uri must be of type "String" or "Object", instead we got: [${typeof params.uri}]`);
    t.is(err.name, 'TypeError');
    t.end();
  });
});

test.cb('error validation when {href} on url is not provided', (t) => {
  const { load } = t.context;
  const params = {
    uri: {},
  };

  load(null, params, (err) => {
    t.is(err.message, 'uri.href must be defined');
    t.is(err.name, 'Error');
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

test.cb('error validation when only auth / username is provided', (t) => {
  const { load, uriHelper: { absolutePath: originalPath }, authBasic: { username } } = t.context;

  const params = {
    uri: originalPath,
    auth: {
      username,
    },
  };

  load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;
    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `originalPath uri path should be different from modified path.
      originalPath: {${originalPath}}, modified: {${modifiedPath}}`);

    // since we are missing password in {uri} object, authentication is incomplete, and 'basic' should not be visible
    t.false(modifiedPath.includes('basic'), `"basic" should not be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('error validation when only auth / password is provided', (t) => {
  const { load, uriHelper: { absolutePath: originalPath }, authBasic: { password } } = t.context;

  const params = {
    uri: originalPath,
    auth: {
      password,
    },
  };

  load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;
    Object.keys(params).forEach(elem => t.true(elem in modifiedParams, `${elem} should be a member of modifiedParams`));

    t.not(originalPath, modifiedPath, `originalPath uri path should be different from modified path.
      originalPath: {${originalPath}}, modified: {${modifiedPath}}`);

    // since we are missing username in {uri} object, authentication is incomplete, and 'basic' should not be visible
    t.false(modifiedPath.includes('basic'), `"basic" should not be part of modified path. provided: {${modifiedPath}}`);
    t.end();
  });
});

test.cb('error validation when {{authType}} tag is missing', (t) => {
  const { load, uriHelper: { noAuthTypePath: originalPath }, authBasic } = t.context;

  const params = {
    uri: originalPath,
    auth: authBasic,
  };

  load(null, params, (err, modifiedParams) => {
    const { uri: { href: modifiedPath } } = modifiedParams;

    // since {authType} is not necessary for this uri, original and modified paths should be equal
    t.is(originalPath, modifiedPath, `originalPath uri path should be different from modified path.
      originalPath: {${originalPath}}, modified: {${modifiedPath}}`);
    t.end();
  });
});

test('error validation when {{authType}} tags do not match requirements', (t) => {
  const { load, uriHelper: { badTagsPath: originalPath } } = t.context;
  const params = {
    uri: originalPath,
  };
  const error = t.throws(() => {
    load(null, params);
  }, Error);
  t.is(error.name, 'Error');
  t.is(error.message, 'Unclosed tag at 45', 'there is an unclosed tag in original {uri}');
});
