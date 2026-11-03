const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = fs.readFileSync(path.join(__dirname, '../src/components/common/DataTable.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } });
const tableModule = { exports: {} };
new Function('require', 'module', 'exports', compiled.outputText)(require, tableModule, tableModule.exports);
const { DataTable } = tableModule.exports;

test('functional accessors render real buttons instead of object text', () => {
  const html = renderToStaticMarkup(React.createElement(DataTable, {
    data: [{ id: 'test', name: 'Agent', count: 0 }], searchable: false,
    columns: [
      { header: 'Name', accessor: 'name' },
      { header: 'Count', accessor: 'count' },
      { header: 'Actions', accessor: () => React.createElement('button', { onClick: () => {} }, 'Modifier') },
    ],
  }));
  assert.match(html, /<button>Modifier<\/button>/);
  assert.match(html, />0<\/td>/);
  assert.doesNotMatch(html, /\[object Object\]/);
});

test('explicit render callbacks keep precedence over accessors', () => {
  const html = renderToStaticMarkup(React.createElement(DataTable, {
    data: [{ id: 'test', name: 'Agent' }], searchable: false,
    columns: [{ header: 'Action', accessor: () => 'fallback', render: () => React.createElement('a', { href: '/users' }, 'Voir') }],
  }));
  assert.match(html, /<a href="\/users">Voir<\/a>/);
  assert.doesNotMatch(html, /fallback/);
});
