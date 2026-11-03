const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/roleConfig.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const config = { exports: {} };
new Function('require', 'module', 'exports', compiled.outputText)(require, config, config.exports);
const { getMenuItemsForUser, hasPermission } = config.exports;
const hasSpecialMenu = user => getMenuItemsForUser(user).some(item => item.path === '/special-expenses');

test('the special module follows effective permissions regardless of email or role label', () => {
  const agent = { role: 'sender_agent', email: 'idrissa@example.test', permissions: ['transfers.view', 'special_expenses.manage'] };
  assert.equal(hasSpecialMenu(agent), true);
  assert.equal(hasSpecialMenu({ ...agent, email: 'changed@example.test' }), true);
  assert.equal(hasSpecialMenu({ ...agent, permissions: [] }), false);
  assert.equal(hasSpecialMenu({ ...agent, email: 'razack@globalexchange.com', permissions: [] }), false);
  assert.equal(hasSpecialMenu({ ...agent, role: 'admin', permissions: [] }), true);
  assert.equal(hasPermission(null, 'special_expenses.manage'), false);
});
