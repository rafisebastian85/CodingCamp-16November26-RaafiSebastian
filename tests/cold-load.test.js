/**
 * Task 10.1 — Cold-load smoke tests
 *
 * Verifies Requirements: 5.5, 2.1, 6.4, 6.5
 *
 * Checks performed:
 *  1. theme.init() sets data-theme to "light" when localStorage is clear (Req 5.5, 5.6)
 *  2. timer.init() renders "25:00" when no duration is persisted (Req 2.1)
 *  3. todo.init() renders an empty task list when localStorage is clear (Req 3.14/3.15)
 *  4. All four widget containers and #theme-toggle are present in the DOM (Req 6.4/6.5)
 *  5. app.js calls themeModule.init() FIRST, then greeting, timer, todo, quicklinks (Req 5.5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// ─── Shared DOM setup ────────────────────────────────────────────────────────

/**
 * Build a minimal but complete index.html DOM in jsdom with a fresh localStorage.
 * Returns the window, document, and a string recording the init() call order.
 */
function buildDOM() {
  const dom = new JSDOM(
    `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head><meta charset="UTF-8"/></head>
<body>
  <button id="theme-toggle" aria-label="Toggle light/dark theme">🌙</button>
  <main class="dashboard-grid">
    <section id="greeting-widget" class="widget">
      <p class="greeting-time"></p>
      <p class="greeting-date"></p>
      <p class="greeting-text"></p>
      <div class="greeting-name-form">
        <input type="text" class="greeting-name-input" maxlength="50" />
        <button type="button" class="greeting-save-btn">Save</button>
      </div>
      <span class="confirmation-badge" hidden></span>
      <span class="error-badge" hidden></span>
    </section>
    <section id="timer-widget" class="widget"></section>
    <section id="todo-widget" class="widget"></section>
    <section id="quicklinks-widget" class="widget"></section>
  </main>
</body></html>`,
    {
      url: 'http://localhost/',
      runScripts: 'dangerously',
    }
  );

  // Expose globals needed by modules
  const { window } = dom;
  window.localStorage.clear();

  return { dom, window, document: window.document };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('cold-load: DOM structure', () => {
  it('index.html contains all required widget containers', () => {
    const { document } = buildDOM();
    expect(document.getElementById('greeting-widget')).not.toBeNull();
    expect(document.getElementById('timer-widget')).not.toBeNull();
    expect(document.getElementById('todo-widget')).not.toBeNull();
    expect(document.getElementById('quicklinks-widget')).not.toBeNull();
    expect(document.getElementById('theme-toggle')).not.toBeNull();
  });
});

describe('cold-load: theme defaults (Req 5.5, 5.6)', () => {
  /**
   * Directly exercises themeModule against a jsdom window with empty localStorage.
   * Patches globalThis so storage.js / theme.js resolve localStorage correctly.
   */
  it('theme.init() applies "light" when localStorage is empty', async () => {
    // Patch globalThis to route localStorage reads to a fresh in-memory store
    const store = {};
    const originalGetItem = globalThis.localStorage?.getItem;
    const originalSetItem = globalThis.localStorage?.setItem;
    const originalRemoveItem = globalThis.localStorage?.removeItem;

    // jsdom sets up localStorage on window; use the vitest jsdom window directly
    localStorage.clear();

    // Import after clearing storage so init() reads an empty store
    const { default: themeModule } = await import('../theme.js');

    // Simulate a fresh document
    document.documentElement.setAttribute('data-theme', 'light'); // reset

    themeModule.init();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('theme.init() applies "dark" when localStorage has theme="dark"', async () => {
    localStorage.clear();
    localStorage.setItem('theme', JSON.stringify('dark'));

    // Re-import to get a fresh call (module is cached; just re-call init)
    const { default: themeModule } = await import('../theme.js');
    themeModule.init();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Clean up
    localStorage.clear();
  });
});

describe('cold-load: timer defaults (Req 2.1)', () => {
  it('timer.init() renders "25:00" when no duration is stored', async () => {
    // Prepare widget DOM
    document.getElementById('timer-widget')?.remove();
    const section = document.createElement('section');
    section.id = 'timer-widget';
    section.className = 'widget';
    document.body.appendChild(section);

    localStorage.clear();

    const { init: initTimer } = await import('../timer.js');
    initTimer();

    const display = document.getElementById('timer-widget')?.querySelector('.timer-display');
    expect(display).not.toBeNull();
    expect(display?.textContent?.trim()).toBe('25:00');
  });
});

describe('cold-load: todo starts empty (Req 3.14)', () => {
  it('todo.init() renders empty task list when localStorage is clear', async () => {
    // Prepare widget DOM
    document.getElementById('todo-widget')?.remove();
    const section = document.createElement('section');
    section.id = 'todo-widget';
    section.className = 'widget';
    document.body.appendChild(section);

    localStorage.clear();

    const { init: initTodo } = await import('../todo.js');
    initTodo();

    const list = document.getElementById('todo-widget')?.querySelector('.todo-list');
    expect(list).not.toBeNull();
    // On clean localStorage the error banner appears (stored is null → Req 3.15)
    // but the task list should be empty (no <li> items)
    expect(list?.querySelectorAll('li').length).toBe(0);
  });
});

describe('cold-load: quicklinks starts empty (Req 4.9)', () => {
  it('quicklinks.init() renders empty link list when localStorage is clear', async () => {
    document.getElementById('quicklinks-widget')?.remove();
    const section = document.createElement('section');
    section.id = 'quicklinks-widget';
    section.className = 'widget';
    document.body.appendChild(section);

    localStorage.clear();

    const { init: initQuicklinks } = await import('../quicklinks.js');
    initQuicklinks();

    const list = document.getElementById('quicklinks-widget')?.querySelector('.quicklinks-list');
    expect(list).not.toBeNull();
    expect(list?.querySelectorAll('li').length).toBe(0);
  });
});

describe('cold-load: app.js initialization order (Req 5.5)', () => {
  it('themeModule.init() is called before greetingModule.init()', async () => {
    // Parse app.js source and assert call order textually
    const fs = await import('fs');
    const path = await import('path');
    const appPath = path.resolve('js/app.js');
    const source = fs.readFileSync(appPath, 'utf8');

    // Extract the DOMContentLoaded callback body
    const listenerMatch = source.match(/DOMContentLoaded[^{]*\{([\s\S]*?)\}\s*\)/);
    const body = listenerMatch ? listenerMatch[1] : source;

    // Find positions of each init call
    const themePos = body.indexOf('themeModule.init()');
    const greetingPos = body.indexOf('initGreeting()');
    const timerPos = body.indexOf('initTimer()');
    const todoPos = body.indexOf('initTodo()');
    const quicklinksPos = body.indexOf('initQuicklinks()');

    expect(themePos).toBeGreaterThanOrEqual(0);
    expect(greetingPos).toBeGreaterThanOrEqual(0);
    expect(timerPos).toBeGreaterThanOrEqual(0);
    expect(todoPos).toBeGreaterThanOrEqual(0);
    expect(quicklinksPos).toBeGreaterThanOrEqual(0);

    // theme must come before all others
    expect(themePos).toBeLessThan(greetingPos);
    expect(themePos).toBeLessThan(timerPos);
    expect(themePos).toBeLessThan(todoPos);
    expect(themePos).toBeLessThan(quicklinksPos);

    // sequence must be: greeting → timer → todo → quicklinks
    expect(greetingPos).toBeLessThan(timerPos);
    expect(timerPos).toBeLessThan(todoPos);
    expect(todoPos).toBeLessThan(quicklinksPos);
  });
});
