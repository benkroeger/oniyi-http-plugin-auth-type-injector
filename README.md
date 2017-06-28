# oniyi-http-plugin-auth-type
Responsible for injecting authentication type into url.

## Install

```sh
$ npm install --save oniyi-http-plugin-auth-type-injector
```

## Usage
```js
const OniyiHttpClient = require('oniyi-http-client');
const oniyiHttpPluginAuthType = require('oniyi-http-plugin-auth-type-injector');

const clientOptions = {};
const httpClient = new OniyiHttpClient(clientOptions);

/* 

This is default mapping object, it can be overridden by providing custom 'typeToNameMap' variable as explained below

const defaultTypeToNameMap = {
  oauth: 'oauth',
  basic: 'basic',
  saml: 'form',
};
 */

const typeToNameMap = {
  oauth: 'myAuthType', // this line overrides default 'myAuthType' type name, and 'myAuthType' will be injected into url if requested
};

const pluginParams = { typeToNameMap };
const initPlugin = oniyiHttpPluginAuthType(pluginParams);

httpClient.use(initPlugin);
```

It is important to follow this rule when defining a request uri:
```js
const requestOptions = {
  auth: {},
  headers: {},
  method: '',
  qs: {},
  uri: 'my/custom/{{authType}}/uri',
}
```
`{{authType}}` can be placed anywhere within uri, things that matters are:
 1. double open '{{' tag
 2. double closing '}} tag
 3. authType template variable

`{{authType}}` does not have to be used with every single http request. 
Even though `httpClient.use(initPlugin);` has been called, if `{{authType}}` is not found in uri, plugin will return
an unchanged uri, as set by `requestOptions`.

For now, we only support 'oauth', 'basic' and 'saml' authorisation types.