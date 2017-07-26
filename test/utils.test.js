'use strict';

// node core modules

// 3rd party modules
const test = require('ava');

// internal modules
const { renderTemplate, formatQuery, formatHref } = require('../lib/utils');


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
  const template = '/foo/{ empty }/{ bar }';
  const templateValues = { bar: 'baz', empty: 'empty-string' };
  const valuesMap = { bar: { baz: 'woohoo' }, empty: { 'empty-string': '' } };
  const result = renderTemplate(template, templateValues, valuesMap);
  t.is(result, '/foo//woohoo');
});

test('formatHref removes doubleslashes', (t) => {
  const template = '/foo//bar';
  const result = formatHref(template);
  t.is(result, '/foo/bar');
});

test('formatHref replaces templateStrings with values from templateValues and removes doubleslashes', (t) => {
  const template = '/foo/{ bar }';
  const templateValues = { bar: '/baz' };
  const result = formatHref(template, templateValues);
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
  const valuesMap = { foo: { bar: 'baz' } };
  const result = formatQuery(query, templateValues, valuesMap);
  t.deepEqual(result, { param: 'baz' });
});
