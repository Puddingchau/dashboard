import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dashHtml = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');

function extractFn(html, name) {
  const sig = 'function ' + name;
  const start = html.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + name);
  let i = html.indexOf('{', start);
  let depth = 0;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + name);
}

function cssBlock(html) {
  const start = html.indexOf('/* Colour follows the visible rank');
  const end = html.indexOf('    .todo-body { flex: 1; min-width: 0; }', start);
  assert.ok(start >= 0 && end > start, 'missing rank colour css');
  return html.slice(start, end);
}

test('index.html and dashboard.html share rank colour helper, render, and css', () => {
  assert.equal(extractFn(indexHtml, 'todoRankPriorityClass'), extractFn(dashHtml, 'todoRankPriorityClass'));
  assert.equal(extractFn(indexHtml, 'renderTodos'), extractFn(dashHtml, 'renderTodos'));
  assert.equal(cssBlock(indexHtml), cssBlock(dashHtml));
  assert.match(extractFn(indexHtml, 'renderTodos'), /todoRankPriorityClass\(ord\)/);
  assert.equal(indexHtml.includes('const ENABLE_DRIVE_SYNC = false;'), true);
  assert.equal(dashHtml.includes('const ENABLE_DRIVE_SYNC = false;'), true);
});

test('visible rank maps to red, blue, then green', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(extractFn(indexHtml, 'todoRankPriorityClass'), context);
  assert.equal(context.todoRankPriorityClass(1), 'prio-high');
  assert.equal(context.todoRankPriorityClass(2), 'prio-high');
  assert.equal(context.todoRankPriorityClass(3), 'prio-mid');
  assert.equal(context.todoRankPriorityClass(4), 'prio-mid');
  assert.equal(context.todoRankPriorityClass(5), 'prio-mid');
  assert.equal(context.todoRankPriorityClass(6), 'prio-low');
  assert.equal(context.todoRankPriorityClass(9), 'prio-low');
  assert.equal(context.todoRankPriorityClass(0), '');
  const css = cssBlock(indexHtml);
  assert.match(css, /\.todo-item\.prio-high \.todo-num[\s\S]*#B91C1C/);
  assert.match(css, /\.todo-item\.prio-mid \.todo-num[\s\S]*#1D4ED8/);
  assert.match(css, /\.todo-item\.prio-low \.todo-num[\s\S]*#166534/);
  assert.doesNotMatch(css, /@media/);
});
