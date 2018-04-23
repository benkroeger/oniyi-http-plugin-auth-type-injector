# oniyi-http-plugin-format-url-template
Plugin for injecting template values into request href and/or query string

## Install

```sh
$ npm install --save oniyi-http-plugin-format-url-template
```

## Usage
```js
const OniyiHttpClient = require('oniyi-http-client');
const oniyiHttpPluginUrlTemplate = require('oniyi-http-plugin-format-url-template');

const options = {
  requestPhases: ['initial','format-url-template', 'final'],
};

const pluginOptions = {
  valuesMap: {
    authType: {
      oauth: 'myAuthType', // this line overrides default 'myAuthType' type name, and 'myAuthType' will be injected into url if requested
    }
  },
  applyToQueryString: true,
};

const plugin = oniyiHttpPluginUrlTemplate(pluginOptions);
const phaseMapOptions = {
  requestPhaseMap: {
    'format-url-template': 'url-template',
  },
  responsePhaseMap: {
    final: 'end',
  },
};

const httpClient = OniyiHttpClient
  .create(options)                // create custom http client with defined phases lists
  .use(plugin, phaseMapOptions);  // mount a plugin
```

These are the default plugin options, they can be overridden as shown above (merged deeply)

```js
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
```
This plugin relies on logic implemented in [oniyi-http-client](https://npmjs.org/package/oniyi-http-client), which has extensive documentation on how phase lists work and what conventions must be followed when implementing a plugin.

## Conventions

It is important to follow couple of conventions when defining a request uri:

   -- **convention 1** --

```js
const requestOptions = {
  auth: {},
  headers: {},
  method: '',
  qs: {},
  uri: 'my/custom/{ authType }/path',
}
```

`{ authType }` can be placed anywhere within uri/url. Valid template string:

 1. {**authType**}
 2. {**authType** }
 3. { **authType**}
 4. { **authType** }

`{authType}` does not have to be used within every single http request in service.
The logic behind this plugin is to only format template Strings if any was found. Otherwise it will return parsed uri without
any changes.

   -- **convention 2** --

```js
const requestOptions = {
  auth: {},
  headers: {},
  method: '',
  qs: {},
  uri: 'my/custom/{ authType }/path/{ pathID }',
  pathID: 'mockId123456',
}
```
You are able to add multiple templates into uri (`'pathID',...`), as long as you define their values within `requestOptions`.

   -- **convention 3** --

Format url template options can be applied on two levels:

   1. When initializing plugin:

```js
const pluginOptions = {
  valuesMap: {},
  applyToUrl: false,
};

httpClient.use(oniyiHttpPluginUrlTemplate(pluginOptions));
```

   2. When configuring http request:

```js
const requestOptions = {
  qs: {},
  uri: 'my/custom/path/without/template',
  plugins: {
    formatUrlTemplate: { // camelized plugin name
      applyToUrl: false,
    },
  },
}
```

Set `applyToUrl` to `false` if there is no need to apply this plugin on an `uri`.

Set `applyToQueryString` to `true` if formatting query string ( 'qs' ) is required.

Setup under 1. overwrites the default `formatUrlTempalte` options, while setup under 2. overwrites initial `pluginOptions` setup

```js
const requestOptions = {
  auth: {},
  headers: {},
  qs: {
    pageSize: '{ pageSize }',
  },
  plugins: {
    formatUrlTemplate: {
      applyToQueryString: true,
    },
  },
  uri: 'my/custom/path',
  pageSize: '15',
}
```

   -- **convention 4** --

It is recommended to use this plugin in combination with [oniyi-http-plugin-credentials](https://npmjs.org/package/oniyi-http-plugin-credentials), since it resolves `authType`
which is being used by this plugin.

Otherwise, `authType` need to be added manually into `requestOptions`.
```js
const requestOptions = {
  authType: 'basic',
    uri: 'my/custom/{ authType }/path',
  //...
  }
```

   -- **convention 5** --

Please provide uri parameter as a String or Url object:
```js
const uriAsString = 'my/custom/authType }/path';
const parsedUri = {
  auth: null,
  hash: null,
  host:'host.com',
  hostname: 'host.com',
  href:'host.com/my/custom/{ authType/path',
  path:'/my/custom/path',
  pathname:'/my/custom/path',
  port: null,
  protocol:'https:',
  query: null,
  search: null,
  slashes: true,
}
```

If `conventions 1 && 2` have not been implemented properly, response uri will look like this:

```
// uri as string request
{
  uri: 'my/custom/authType }/path',
}
// uri as parsed object
{
  uri: {
    auth: null,
    hash: null,
    host:'host.com',
    hostname: 'host.com',
    href:'host.com/my/custom/%7B%20authType/path',
    path:'/my/custom/%7B%20authType/path',
    pathname:'/my/custom/%7B%20authType/path',
    port: null,
    protocol:'https:',
    query: null,
    search: null,
    slashes: true,
  },
}

```
The reason why `uriAsString` response is not encoded as `parsedUri` is because plugin takes `href` prop from `parsedUri`, 
uses `url.parse(href);` which encodes all special characters that are used in the href path.

This way plugin is notifying service that something went wrong while setting up, most likely because of a typo.

`authType` can be added with falsy value as default, and in return it will
be removed completely from an uri.
```js
const requestOptions = {
  authType: '', // or 0, null, undefined, false, NaN
  uri: 'my/custom/{ authType }/path',
  //...
  };
  //...

const httpResponse = {
  uri: 'my/custom/path',
}
```

Similar goes for `qs` parameter, response will look like this:
```
{
  qs: {
    pageSize: '{ psTemplate }',
  }
}

```

The reason why `qs` response is not encoded as `uri` is because plugin uses `url.parse(uri);` which encodes
all special characters that are used in the uri string.

This way it should be relatively simple injecting any parameter into service `uri / qs` path, in order to load the same
service with different auth providers (ibm-connections-cloud, microsoft...) by using custom template mapping.
