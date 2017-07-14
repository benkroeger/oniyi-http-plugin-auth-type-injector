'use strict';

// node core modules

// 3rd party modules
const test = require('ava');

// internal modules
const { renderTemplate, formatQuery, formatPath } = require('../lib/utils');


test('renderTemplate leaves template unchanged when templateString is undefined in templateValues', (t) => {
  const template = '/foo/{ bar }';
  const templateValues = { };
  const result = renderTemplate(template, templateValues);
  t.is(result, template);
});

test('renderTemplate replaces templateStrings with values from templateValues', (t) => {
  const template = '/foo/{ bar }';
  const templateValues = { bar: 'baz' };
  const result = renderTemplate(template, templateValues);
  t.is(result, '/foo/baz');
});

test('renderTemplate replaces templateStrings with values from valuesMap if not undefined', (t) => {
  const template = '/foo/{ bar }';
  const templateValues = { bar: 'baz' };
  const valuesMap = { baz: 'woohoo' };
  const result = renderTemplate(template, templateValues, valuesMap);
  t.is(result, '/foo/woohoo');
});

test('formatPath removes doubleslashes', (t) => {
  const template = '/foo//bar';
  const result = formatPath(template);
  t.is(result, '/foo/bar');
});

test('formatPath replaces templateStrings with values from templateValues and removes doubleslashes', (t) => {
  const template = '/foo/{ bar }';
  const templateValues = { bar: '/baz' };
  const result = formatPath(template, templateValues);
  t.is(result, '/foo/baz');
});

test('formatQuery replaces templateStrings in querystring object', (t) => {
  const query = { param: '{ foo }' };
  const templateValues = { foo: 'bar' };
  const result = formatQuery(query, templateValues);
  t.deepEqual(result, { param: 'bar' });
});

test('formatQuery replaces templateStrings in querystring object with values from valuesMap if not undefined', (t) => {
  const query = { param: '{ foo }' };
  const templateValues = { foo: 'bar' };
  const valuesMap = { bar: 'baz' };
  const result = formatQuery(query, templateValues, valuesMap);
  t.deepEqual(result, { param: 'baz' });
});
