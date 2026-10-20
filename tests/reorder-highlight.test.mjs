import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dashHtml = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');

function themeBlock(html, selector) {
  const start = html.indexOf(selector);
  assert.ok(start >= 0, 'missing ' + selector);
  const end = html.indexOf('\n    }', start);
  assert.ok(end > start, 'unclosed ' + selector);
  return html.slice(start, end);
}

for (const [name, html] of [['index', indexHtml], ['dashboard', dashHtml]]) {
  test(name + ' gold hold color on rain, beach, and toy', () => {
    for (const sel of ['body.theme-rain-cafe', 'body.theme-sunny-beach', 'body.theme-toy']) {
      const block = themeBlock(html, sel + ' {');
      assert.match(block, /--drag-active-bg:\s*#F6C453/);
    }
    assert.match(html, /--drag-active-bg:\s*#F6C453/);
  });

  test(name + ' blue hold color on sky, cloud, clear, and dusk', () => {
    const block = themeBlock(html, 'body.theme-sky,\n    body.theme-cloud,\n    body.theme-clear,\n    body.theme-dusk {');
    assert.match(block, /--drag-active-bg:\s*#8EBEFF/);
    assert.doesNotMatch(themeBlock(html, 'body.theme-toy {'), /#8EBEFF/);
    assert.doesNotMatch(themeBlock(html, 'body.theme-rain-cafe {'), /#8EBEFF/);
  });

  test(name + ' hold class paints todos, events, shortcuts, and bus rows', () => {
    assert.match(html, /body \.todo-item\.todo-draggable\.reorder-hold/);
    assert.match(html, /body \.event-item\.event-draggable\.reorder-hold/);
    assert.match(html, /body \.sc-item\.reorder-hold/);
    assert.match(html, /body \.bus-card\.reorder-hold/);
    assert.match(html, /background-color:\s*var\(--drag-active-bg,\s*#F6C453\)\s*!important/);
    assert.match(html, /function beginReorderHold/);
    assert.match(html, /function endReorderHold/);
    assert.match(html, /function bindEventDnD/);
    assert.match(html, /event-draggable/);
  });
}
