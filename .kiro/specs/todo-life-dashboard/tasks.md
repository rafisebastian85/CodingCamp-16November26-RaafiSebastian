# Implementation Plan: Todo List Life Dashboard

## Overview

Implement a single-page, client-side productivity dashboard in plain HTML, CSS, and Vanilla JavaScript. The app is composed of five modules (greeting, timer, to-do, quick links, theme) wired together by a thin `app.js` entry point. All state persists in `localStorage`. No build tooling, no frameworks, no external network requests.

## Tasks

- [x] 1. Scaffold project structure and shared storage utility
  - Create directory layout: `css/`, `js/`, and root `index.html`
  - Write `js/storage.js` with `get(key)`, `set(key, value)`, and `isAvailable()` methods, each wrapping `localStorage` calls in `try/catch`; `set` serialises with `JSON.stringify`, `get` deserialises with `JSON.parse`; both return `null`/`false` on any exception
  - Write `index.html` with five widget containers (`#greeting-widget`, `#timer-widget`, `#todo-widget`, `#quicklinks-widget`, `#theme-toggle`) and a `<script type="module" src="js/app.js">` tag
  - Create empty module stubs (`greeting.js`, `timer.js`, `todo.js`, `quicklinks.js`, `theme.js`) each exporting an `init()` function
  - Write `js/app.js` that imports all five modules and calls `init()` on each in order on `DOMContentLoaded`
  - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 1.1 Write unit tests for storage utility
    - Test `get` on absent key returns `null`
    - Test `set` then `get` round-trip returns original value
    - Test `isAvailable()` returns `true` in jsdom environment
    - _Requirements: 6.1, 6.8_

- [x] 2. Implement Theme Toggle (`theme.js`)
  - [x] 2.1 Implement `themeModule.init()` and `themeModule.toggle()`
    - `init()` reads `localStorage` for key `theme`; sets `document.documentElement.setAttribute('data-theme', value)` — defaults to `"light"` when key is absent or read fails
    - `toggle()` reads current `data-theme` attribute, inverts it, writes the attribute, and persists via `storage.set('theme', value)`
    - Bind the toggle control in `#theme-toggle` to call `toggle()` on click
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 2.2 Write property test for theme toggle (Property 10)
    - **Property 10: Theme toggle is its own inverse**
    - Start from either `"light"` or `"dark"`; call `toggle()` twice; assert `data-theme` attribute and `localStorage` value are restored to initial
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [ ]* 2.3 Write unit tests for theme module
    - Test `init()` with `"dark"` in storage sets attribute to `"dark"`
    - Test `init()` with absent key defaults to `"light"`
    - Test `toggle()` from light → dark, then dark → light
    - _Requirements: 5.2, 5.3, 5.5, 5.6_

- [x] 3. Implement CSS theming and global layout (`css/style.css`)
  - Define CSS custom properties for colours, spacing, and typography on `:root`
  - Add `[data-theme="dark"]` overrides that re-skin every surface via custom property swaps
  - Implement responsive grid layout: multi-column on ≥ 768 px, single-column stack on < 768 px
  - Style all five widget containers, the theme toggle button, and common elements (inputs, buttons, badges)
  - _Requirements: 5.2, 5.3, 6.6, 6.7_

- [x] 4. Implement Greeting Widget (`greeting.js`)
  - [x] 4.1 Implement clock, date display, and greeting prefix logic
    - Export `getGreetingPrefix(hour)` — pure function mapping hour [0–23] to one of four prefix strings using exclusive ranges (05–11 → morning, 12–17 → afternoon, 18–20 → evening, 21–04 → night)
    - Start a `setInterval` (1 s) that reads `new Date()`; updates the HH:MM display only when minutes change; updates the date string on each tick
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 4.2 Write property test for greeting prefix (Property 1)
    - **Property 1: Greeting prefix covers every hour**
    - Generate random integer in [0, 23]; assert result is exactly one of the four expected strings, never `undefined` or empty
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 4.3 Implement name persistence and confirmation/error UI
    - Restore saved name from `storage.get('greeting_name')` on `init()` and render in greeting
    - Validate name input: 1–50 chars; on save (Enter or button click) call `storage.set`; if `storage.isAvailable()` is `false` show `.error-badge`; on success update greeting text and show `.confirmation-badge` for 2 000 ms then hide it
    - If no name saved, display greeting prefix without name suffix
    - _Requirements: 1.7, 1.8, 1.9, 1.10_

  - [ ]* 4.4 Write unit tests for greeting module
    - Test `getGreetingPrefix` for all 24 hours
    - Test name validation: 0 chars (reject), 1 char (accept), 50 chars (accept), 51 chars (reject)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 5. Implement Focus Timer (`timer.js`)
  - [x] 5.1 Implement MM:SS formatter and duration validator
    - Write `formatTime(seconds)` — returns a string matching `^\d{2}:\d{2}$` for any integer in [0, 3600]
    - Write `validateDuration(input)` — accepts if and only if input is an integer in [1, 60]; rejects floats, strings, and out-of-range numbers
    - _Requirements: 2.1, 2.8, 2.10_

  - [ ]* 5.2 Write property test for timer display format (Property 11)
    - **Property 11: Timer display format validity**
    - Generate integer in [0, 3600]; assert `formatTime` output matches `^\d{2}:\d{2}$` with minutes in [00, 60] and seconds in [00, 59]
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 5.3 Write property test for duration range enforcement (Property 12)
    - **Property 12: Pomodoro duration range enforcement**
    - Generate arbitrary integers, floats, and strings; assert validator accepts iff value is integer in [1, 60]
    - **Validates: Requirements 2.8, 2.10**

  - [x] 5.4 Implement timer state machine (start, stop, reset, tick, completion)
    - Restore `durationMinutes` from `storage.get('timer_duration')` on `init()`; default to 25
    - Render initial MM:SS display using `formatTime`
    - **Start:** if `remainingSeconds === 0` reset to `durationMinutes * 60` first; call `setInterval(tick, 1000)`
    - **Stop:** `clearInterval`; retain `remainingSeconds`
    - **Reset:** `clearInterval`; set `remainingSeconds = durationMinutes * 60`; re-render
    - **Tick:** decrement `remainingSeconds`; re-render; at zero `clearInterval`, call `playAlert()`, show `.completion-badge`
    - **`playAlert()`:** create `AudioContext`, connect `OscillatorNode` (sine, 440 Hz), start and stop after 1 s; wrap in try/catch — on failure show visual badge only
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 5.5 Implement duration save with validation and error UI
    - On duration save: call `validateDuration`; on failure show inline `.validation-error` with "1–60 minutes" message
    - On success: `storage.set('timer_duration', value)`; if `storage.isAvailable()` is `false` show inline error; update `durationMinutes`; reset display if no session active
    - _Requirements: 2.8, 2.9, 2.10_

  - [ ]* 5.6 Write unit tests for timer module
    - Test `formatTime` boundary values: 0 s → "00:00", 1500 s → "25:00", 3600 s → "60:00"
    - Test `validateDuration`: 0 (reject), 1 (accept), 60 (accept), 61 (reject), 1.5 (reject), "abc" (reject)
    - Test state transitions: start → tick → stop → start (resume) → reset
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.8, 2.10_

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass for modules implemented so far (`storage.js`, `theme.js`, `greeting.js`, `timer.js`), ask the user if questions arise.

- [x] 7. Implement To-Do List (`todo.js`)
  - [x] 7.1 Implement task add with validation and debounced save
    - Internal state: `tasks: Array<{ id, text, completed }>` — IDs via `crypto.randomUUID()`
    - **Add:** validate non-empty and ≤ 200 chars; push task with `completed: false`; re-render list; clear input; schedule debounced save (500 ms `setTimeout`, reset on each change)
    - On empty submit: reject and retain focus on input
    - On over-length text: reject and show `.validation-error`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.13_

  - [ ]* 7.2 Write property test for valid task add (Property 2)
    - **Property 2: Task list grows by exactly one on valid add**
    - Generate arbitrary task array + string in [1, 200] chars; assert length +1 and last element has `completed = false`
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 7.3 Write property test for invalid task add (Property 3)
    - **Property 3: Whitespace-only and over-length inputs are rejected**
    - Generate string that is empty, whitespace-only, or > 200 chars; assert list length unchanged
    - **Validates: Requirements 3.3, 3.4**

  - [x] 7.4 Implement task toggle and delete
    - **Toggle:** flip `task.completed`; re-render item (apply/remove strikethrough class); schedule debounced save
    - **Delete:** remove task by `id` from array; re-render list; schedule debounced save
    - _Requirements: 3.5, 3.6, 3.7, 3.12, 3.13_

  - [ ]* 7.5 Write property test for toggle inverse (Property 4)
    - **Property 4: Task completion toggle is its own inverse**
    - Generate task array + random index; toggle twice; assert `completed` unchanged for all tasks
    - **Validates: Requirements 3.6, 3.7**

  - [x] 7.6 Implement inline task edit
    - **Edit:** replace task row with inline edit form pre-populated with existing text; hide Edit and Delete controls for that task
    - On confirm with non-empty text ≤ 200 chars: update `task.text`; re-render; schedule debounced save
    - On confirm with empty text: reject update; return to default display state
    - On confirm with text > 200 chars: reject update; keep editable field with original text
    - On cancel: re-render without change
    - _Requirements: 3.8, 3.9, 3.10, 3.11, 3.13_

  - [ ]* 7.7 Write property test for edit validation (Property 6)
    - **Property 6: Edit rejects invalid inputs without data loss**
    - Generate task + invalid replacement (empty or > 200 chars); assert `task.text` unchanged and list length unchanged
    - **Validates: Requirements 3.10, 3.11**

  - [x] 7.8 Implement task list load from localStorage with error handling
    - On `init()`: `JSON.parse(storage.get('todo_tasks'))`; on `null` or parse error render empty list and show `.storage-error` banner
    - Restore each task's text and `completed` state; render full list within 1 s of load
    - _Requirements: 3.14, 3.15_

  - [ ]* 7.9 Write property test for task serialisation round-trip (Property 5)
    - **Property 5: Task serialisation round-trip**
    - Generate array of `Task` objects; `JSON.parse(JSON.stringify(arr))`; deep-equal assert each element
    - **Validates: Requirements 3.13, 3.14**

  - [ ]* 7.10 Write unit tests for todo module
    - Test add: valid text, empty text, 200-char (accept), 201-char (reject)
    - Test edit: valid text, empty text, over-length text
    - Test toggle twice returns original `completed` state
    - Test delete removes correct task by `id`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.9, 3.10, 3.11, 3.12_

- [x] 8. Implement Quick Links (`quicklinks.js`)
  - [x] 8.1 Implement URL validator and add-link logic
    - Write `validateUrl(url)` — accepts if and only if `url` starts with `"http://"` or `"https://"`, is non-empty, and `url.length ≤ 2048`
    - **Add:** apply all five validation rules (non-empty label ≤ 50 chars; `validateUrl`; no duplicate URL; `links.length < 20`); on pass push link with `crypto.randomUUID()` id; re-render; `storage.set('quicklinks_links', links)`
    - On any validation failure show inline `.validation-error` per failing field without modifying the list
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 8.2 Write property test for URL validator consistency (Property 7)
    - **Property 7: Quick Links URL validation is consistent**
    - Generate arbitrary string; assert validator accepts iff string starts with `"http://"` or `"https://"`, is non-empty, and length ≤ 2048
    - **Validates: Requirements 4.3, 4.4**

  - [ ]* 8.3 Write property test for duplicate URL rejection (Property 8)
    - **Property 8: Quick Links duplicate rejection**
    - Generate link list + pick an existing URL; assert list length unchanged after add attempt
    - **Validates: Requirements 4.5**

  - [x] 8.4 Implement link open and delete, and load from localStorage
    - **Open:** `window.open(url, '_blank', 'noopener,noreferrer')` on button click
    - **Delete:** remove link by `id`; re-render; `storage.set('quicklinks_links', links)`
    - **Load:** on `init()` parse `storage.get('quicklinks_links')`; on parse error or absent key render empty list silently (no user-facing error)
    - Render up to 20 links maximum
    - _Requirements: 4.6, 4.7, 4.8, 4.9_

  - [ ]* 8.5 Write property test for link serialisation round-trip (Property 9)
    - **Property 9: Link serialisation round-trip**
    - Generate array of `Link` objects; `JSON.parse(JSON.stringify(arr))`; deep-equal assert each element
    - **Validates: Requirements 4.2, 4.8**

  - [ ]* 8.6 Write unit tests for quicklinks module
    - Test URL validator: valid http, valid https, missing protocol, `ftp://` (reject), empty (reject), 2048-char (accept), 2049-char (reject)
    - Test duplicate URL rejection
    - Test label validation: empty (reject), 50 chars (accept), 51 chars (reject)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass for all modules, ask the user if questions arise.

- [x] 10. Wire all modules and polish
  - [x] 10.1 Verify `app.js` initialisation order and confirm all widgets render on cold load
    - Confirm `theme.init()` is called first (before any paint), then greeting, timer, todo, quicklinks in sequence
    - Verify `localStorage` is cleared and `index.html` opens without JS errors; confirm all widgets render, theme defaults to light, timer shows 25:00, task list is empty
    - _Requirements: 5.5, 2.1, 6.4, 6.5_

  - [x] 10.2 Implement and verify responsive layout across viewport widths
    - Confirm no overlapping, clipping, or horizontal scroll at 320 px and 2560 px
    - Confirm single-column stacking at viewports < 768 px
    - _Requirements: 6.6, 6.7_

  - [ ]* 10.3 Write integration tests for cross-module persistence round-trip
    - Simulate add task, add link, change name, change theme; hard-reload (restore from storage); assert all values match
    - _Requirements: 1.8, 2.9, 3.14, 4.8, 5.4_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between phases
- Property tests validate universal correctness properties (defined in design.md); unit tests validate specific examples and edge cases
- Run tests with `vitest --run` for a single-pass execution (no watch mode)
- The `storage.js` utility ensures `localStorage` failures never propagate uncaught — each module relies on it for all persistence
- `crypto.randomUUID()` has baseline support in Chrome, Firefox, Edge, and Safari; no polyfill needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "4.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.2", "5.2", "5.3"] },
    { "id": 3, "tasks": ["4.3", "5.4", "7.1", "8.1"] },
    { "id": 4, "tasks": ["4.4", "5.5", "7.2", "7.3", "8.2", "8.3"] },
    { "id": 5, "tasks": ["5.6", "7.4", "8.4"] },
    { "id": 6, "tasks": ["7.5", "7.6", "8.5", "8.6"] },
    { "id": 7, "tasks": ["7.7", "7.8"] },
    { "id": 8, "tasks": ["7.9", "7.10", "10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3"] }
  ]
}
```
