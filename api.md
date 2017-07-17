## Functions

<dl>
<dt><a href="#pluginFactory">pluginFactory()</a> ⇒ <code>*</code></dt>
<dd><p>Replace templateStrings in your requestOptions&#39;s <code>uri</code> and <code>qs</code> with values extracted from other
properties in <code>requestOptions</code></p>
</dd>
<dt><a href="#load">load(req, requestOptions, callback)</a></dt>
<dd><p>the actual plugin execution (runs per-request)</p>
</dd>
<dt><a href="#renderTemplate">renderTemplate(template, templateValues, valuesMap)</a></dt>
<dd><p>Formatting template with provided &#39;templateValues&#39;.
Using &#39;valuesMap&#39; to look for custom mapping as a result from previous &#39;templateValues&#39; mapping.
Provided &#39;regex&#39; extracts String template from given template and groups them into elements:</p>
<p> e.g.  template: &#39;/{ authType }/foo/{bar}/test/path&#39;,
       templateValues = { authType: &#39;saml&#39;, bar: &#39;itWorks&#39; },
       valuesMap = { saml: &#39;saml2&#39; }</p>
<p>&#39;templateString&#39; -&gt; { authType }, {bar}
&#39;name&#39; -&gt; authType, bar</p>
<p> templateValues[name] -&gt; &#39;saml&#39;
 valuesMap[templateValues[name]] -&gt; valuesMap[&#39;saml&#39;] -&gt; &#39;saml2&#39;</p>
<p>&#39;templateString&#39; is left in the template by default intentionally for debugging purposes</p>
<p>The result:</p>
<p>/saml2/foo/itWorks/test/path</p>
</dd>
<dt><a href="#formatQuery">formatQuery(query, templateValues, valuesMap)</a></dt>
<dd><p>Format query parameters object</p>
<ol>
<li>querystring.stringify() transforms query object into String</li>
<li>formatString() is responsible for template formatting</li>
<li>querystring.parse() transforms formatted queryString into an object</li>
</ol>
</dd>
</dl>

<a name="pluginFactory"></a>

## pluginFactory() ⇒ <code>\*</code>
Replace templateStrings in your requestOptions's `uri` and `qs` with values extracted from other
properties in `requestOptions`

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params.valuesMap] | <code>Object</code> |  | map templateValues to a custom value |
| [params.applyToUrl] | <code>Boolean</code> | <code>true</code> | parse template strings in url parameter? |
| [params.applyToQueryString] | <code>Boolean</code> | <code>false</code> | parse template strings in query parameter? |

**Example**  
```js
// disables modifying request url
pluginFactory({ applyToUrl: false });
```
**Example**  
```js
// enables modifying request querystring
pluginFactory({ applyToQueryString: true });
```
**Example**  
```js
// provides custom values map for { authType } templateString
pluginFactory({ valuesMap: { authType: { oauth: 'oauth2' } } });
```
<a name="load"></a>

## load(req, requestOptions, callback)
the actual plugin execution (runs per-request)

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | HTTP request object |
| requestOptions | <code>Object</code> | options for executing HTTP request with oniyi-http-client |
| callback | <code>function</code> | [description] |

**Example**  
```js
// simplified `req` and `requestOptions.uri` args
load(null, { uri: '/api/foo/{ authType }/bar', authType: 'oauth' }, (err, requestOptions) => {
 console.log(requestOptions.uri); // '/api/foo/oauth/bar'
});
```
<a name="renderTemplate"></a>

## renderTemplate(template, templateValues, valuesMap)
Formatting template with provided 'templateValues'.
Using 'valuesMap' to look for custom mapping as a result from previous 'templateValues' mapping.
Provided 'regex' extracts String template from given template and groups them into elements:

 e.g.  template: '/{ authType }/foo/{bar}/test/path',
       templateValues = { authType: 'saml', bar: 'itWorks' },
       valuesMap = { saml: 'saml2' }

'templateString' -> { authType }, {bar}
'name' -> authType, bar

 templateValues[name] -> 'saml'
 valuesMap[templateValues[name]] -> valuesMap['saml'] -> 'saml2'

'templateString' is left in the template by default intentionally for debugging purposes

The result:

/saml2/foo/itWorks/test/path

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| template | <code>String</code> | Path that needs to be formatted |
| templateValues | <code>Object</code> | Options that hold mapping details required by formatting method |
| valuesMap | <code>Object</code> | Options that hold mapping details required by formatting method |

<a name="formatQuery"></a>

## formatQuery(query, templateValues, valuesMap)
Format query parameters object

1. querystring.stringify() transforms query object into String
3. formatString() is responsible for template formatting
4. querystring.parse() transforms formatted queryString into an object

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>Object</code> | Query object that has {key: value} pairs |
| templateValues | <code>Object</code> | Options that hold mapping details required by formatting method |
| valuesMap | <code>Object</code> | Options that hold mapping details required by formatting method |

