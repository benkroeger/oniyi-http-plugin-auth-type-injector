# oniyi-http-plugin-auth-type
Plugin responsible for injecting injecting template values in url path or query string (qs) object.

## Install

```sh
$ npm install --save oniyi-http-plugin-format-url-template
```

## Usage
```js
const OniyiHttpClient = require('oniyi-http-client');
const oniyiHttpPluginUrlTemplate = require('oniyi-http-plugin-format-url-template');

const clientOptions = {};
const httpClient = new OniyiHttpClient(clientOptions);

const pluginOptions = {
  valuesMap: {
    authType: {
      oauth: 'myAuthType', // this line overrides default 'myAuthType' type name, and 'myAuthType' will be injected into url if requested
    }
  },
  applyToQueryString: true,
};

httpClient.use(oniyiHttpPluginUrlTemplate(pluginOptions));
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

httpClient.use(oniyiHttpPluginAuthType(pluginOptions));
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

It is recommended to use this plugin in combination with `oniyi-http-plugin-credentials`, since it resolves `authType`
which is being used by this plugin.

Otherwise, `authType` need to be added manually into `requestOptions`.
```js
const requestOptions = {
  authType: 'basic',
    uri: 'my/custom/{ wrongAuthType }/path',
  //...
  }
```

If `conventions 1 && 2` have not been implemented properly, plugin will leave `url` object with _encoded_ special
characters / tags as follows:
```
{
  uri: {
    auth: null,
    hash: null,
    host:'host.com',
    hostname: 'host.com',
    href:'host.com/my/custom/%7B%20wrongAuthType%20%7D/path',
    path:'/my/custom/%7B%20wrongAuthType%20%7D/path',
    pathname:'/my/custom/%7B%20wrongAuthType%20%7D/path',
    port: null,
    protocol:'https:',
    query: null,
    search: null,
    slashes: true,
  },
}
```

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
  uri: {
    auth: null,
    hash: null,
    host:'host.com',
    hostname: 'host.com',
    href:'host.com/my/custom/path',
    path:'/my/custom/path',
    pathname:'/my/custom/path',
    port: null,
    protocol:'https:',
    query: null,
    search: null,
    slashes: true,
  },
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
service by different auth providers (ibm-connections-cloud, microsoft...) by using custom template mapping.
