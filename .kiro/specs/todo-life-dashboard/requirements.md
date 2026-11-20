# Requirements Document

## Introduction

The Todo List Life Dashboard is a personal, client-side web application that consolidates four productivity-focused widgets — a contextual greeting, a Pomodoro focus timer, a to-do list, and a quick-links launcher — alongside a light/dark theme toggle. The app is built with plain HTML, CSS, and Vanilla JavaScript. All user data is persisted in the browser's Local Storage. The app must run correctly in Chrome, Firefox, Edge, and Safari with no server-side component or build step.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI component that displays the current time, date, and a personalized greeting.
- **Timer**: The Pomodoro focus timer widget.
- **Session**: A single uninterrupted countdown period within the Timer.
- **Todo_List**: The widget that manages user tasks.
- **Task**: A single item in the Todo_List with a text description and a completion state.
- **Quick_Links**: The widget that displays user-defined shortcut buttons to external URLs.
- **Link**: A single entry in the Quick_Links widget with a label and a URL.
- **Theme_Toggle**: The control that switches the Dashboard between light and dark visual themes.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Pomodoro_Duration**: The configurable length (in minutes) of a single Timer Session, defaulting to 25 minutes.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a greeting that addresses me by name, so that the Dashboard feels personal and contextually relevant when I open it.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM 24-hour format, updated at each clock minute boundary (i.e., when the system clock's seconds value resets to 00).
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, 16 November 2026").
3. WHEN the current local hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the prefix "Good morning".
4. WHEN the current local hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the prefix "Good afternoon".
5. WHEN the current local hour is between 18:00 and 20:59, THE Greeting_Widget SHALL display the prefix "Good evening".
6. WHEN the current local hour is between 21:00 and 04:59, THE Greeting_Widget SHALL display the prefix "Good night".
7. THE Greeting_Widget SHALL allow the user to enter a custom name of between 1 and 50 characters that is appended to the greeting prefix (e.g., "Good morning, Raafi").
8. WHEN the user confirms a custom name by pressing Enter or activating the save button, THE Greeting_Widget SHALL persist the name in Local_Storage, display the updated greeting immediately, and show a visible confirmation indicator for at least 2 seconds.
9. IF no custom name has been saved, THEN THE Greeting_Widget SHALL display the greeting prefix without a name suffix.
10. IF Local_Storage is unavailable when the user confirms a custom name, THEN THE Greeting_Widget SHALL display the updated greeting for the current session and show an error message indicating the name could not be saved permanently.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a Pomodoro-style countdown timer with start, stop, and reset controls and a configurable duration, so that I can structure focused work sessions without leaving the Dashboard.

#### Acceptance Criteria

1. THE Timer SHALL display a countdown in MM:SS format initialised to the current Pomodoro_Duration, where Pomodoro_Duration defaults to 25 minutes on first load when no value has been persisted in Local_Storage.
2. WHEN the user activates the Start control, THE Timer SHALL begin counting down from the displayed time at a rate of one second per second.
3. WHEN the user activates the Stop control during a Session, THE Timer SHALL pause the countdown and retain the remaining time.
4. WHEN the user activates the Start control after a Stop, THE Timer SHALL resume the countdown from the retained remaining time.
5. WHEN the user activates the Reset control, THE Timer SHALL stop any active Session and reset the displayed time to the current Pomodoro_Duration.
6. WHEN the countdown reaches 00:00, THE Timer SHALL stop automatically, emit an audible alert lasting at least 1 second via the Web Audio API, and display a visible completion indicator; IF the Web Audio API is not supported by the browser, THEN THE Timer SHALL display the visible completion indicator without emitting sound.
7. WHEN the user activates the Start control while the displayed time is 00:00, THE Timer SHALL reset the displayed time to the current Pomodoro_Duration and begin counting down.
8. THE Timer SHALL allow the user to set a custom Pomodoro_Duration in whole minutes within the range of 1 to 60 minutes inclusive.
9. WHEN the user saves a custom Pomodoro_Duration, THE Timer SHALL persist the value in Local_Storage and restore it on the next page load; IF Local_Storage is unavailable, THEN THE Timer SHALL display an error message indicating the duration could not be saved and apply the value for the current session only.
10. IF the user attempts to set a Pomodoro_Duration outside the range of 1 to 60, THEN THE Timer SHALL reject the input and display an inline validation message indicating the valid range.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, mark as done, and delete tasks that persist across browser sessions, so that I can track my daily responsibilities directly from the Dashboard.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an input field accepting up to 200 characters and an Add control that creates a new Task from the entered text.
2. WHEN the user submits the Add control with a non-empty input, THE Todo_List SHALL append the new Task to the list and clear the input field.
3. IF the user submits the Add control with an empty input, THEN THE Todo_List SHALL reject the submission and retain focus on the input field without creating a Task.
4. IF the user enters text exceeding 200 characters in the input field, THEN THE Todo_List SHALL reject the submission and display an error indicating the 200-character limit.
5. THE Todo_List SHALL display each Task with a toggle control for completion state, an Edit control, and a Delete control.
6. WHEN the user activates the completion toggle for an incomplete Task, THE Todo_List SHALL mark the Task as complete and apply a strikethrough style to its text.
7. WHEN the user activates the completion toggle for a completed Task, THE Todo_List SHALL mark the Task as incomplete and remove the strikethrough style.
8. WHEN the user activates the Edit control for a Task, THE Todo_List SHALL present the Task text in an editable field pre-populated with the existing text and hide the Edit and Delete controls for that Task until the edit is confirmed or cancelled.
9. WHEN the user confirms an edit with non-empty text of up to 200 characters, THE Todo_List SHALL update the Task text and return to the default display state for that Task.
10. IF the user confirms an edit with empty text, THEN THE Todo_List SHALL reject the update, retain the original Task text, and return to the default display state for that Task.
11. IF the user confirms an edit with text exceeding 200 characters, THEN THE Todo_List SHALL reject the update and retain the editable field with the original Task text.
12. WHEN the user activates the Delete control for a Task, THE Todo_List SHALL permanently remove that Task from the list.
13. WHEN any Task is added, edited, toggled, or deleted, THE Todo_List SHALL synchronise the full Task list to Local_Storage within 500 milliseconds of the change.
14. WHEN the Dashboard loads, THE Todo_List SHALL restore all Tasks from Local_Storage within 1 second, preserving each Task's text and completion state.
15. IF Local_Storage is unavailable or returns a parse error on Dashboard load, THEN THE Todo_List SHALL display an empty task list and show an error message indicating that saved tasks could not be loaded.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and launch shortcut buttons to my favorite websites, so that I can navigate to them directly from the Dashboard without searching.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide an input form that accepts a label of up to 50 characters and a URL of up to 2048 characters to create a new Link.
2. WHEN the user submits the add-link form with a non-empty label and a URL that begins with "http://" or "https://", THE Quick_Links widget SHALL add the Link, render it as a clickable button, and persist the updated list to Local_Storage.
3. IF the user submits the add-link form with an empty label or an empty URL, THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message without modifying the Link list.
4. IF the user submits the add-link form with a URL that does not begin with "http://" or "https://", THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message without modifying the Link list.
5. IF the user submits the add-link form with a URL that is identical to an existing Link's URL, THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message indicating the URL already exists.
6. WHEN the user activates a Link button, THE Quick_Links widget SHALL open the associated URL in a new browser tab.
7. WHEN the user activates the Delete control for a Link, THE Quick_Links widget SHALL immediately remove that Link from the display and persist the updated list to Local_Storage.
8. WHEN the Dashboard loads and Local_Storage contains a valid Link list, THE Quick_Links widget SHALL restore and render all stored Links, up to a maximum of 20 Links.
9. IF the Dashboard loads and Local_Storage contains no Link data or unparseable Link data, THEN THE Quick_Links widget SHALL render an empty Link list with no error shown to the user.

---

### Requirement 5: Light/Dark Mode

**User Story:** As a user, I want to toggle between a light and a dark visual theme, so that the Dashboard is comfortable to use in different lighting conditions.

#### Acceptance Criteria

1. 8THE Theme_Toggle SHALL be rendered in a fixed position that remains visible in the viewport on all Dashboard pages without requiring the user to scroll.
2. WHEN the user activates the Theme_Toggle while the Dashboard is in light mode, THE Dashboard SHALL set the root element's theme attribute to dark and apply the dark-mode colour styles to all surfaces, including widget backgrounds, text, borders, the navigation bar, and the Theme_Toggle itself.
3. WHEN the user activates the Theme_Toggle while the Dashboard is in dark mode, THE Dashboard SHALL set the root element's theme attribute to light and apply the light-mode colour styles to all surfaces, including widget backgrounds, text, borders, the navigation bar, and the Theme_Toggle itself.
4. WHEN the user changes the theme, THE Theme_Toggle SHALL persist the selected theme as a string value of either "light" or "dark" in Local_Storage under a consistent key.
5. WHEN the Dashboard loads, THE Theme_Toggle SHALL read the theme value from Local_Storage and apply the corresponding theme before the first render completes, so no flash of the opposite theme is visible.
6. IF no theme has been previously saved, THEN THE Dashboard SHALL apply light mode as the default theme.
7. IF reading from Local_Storage fails, THEN THE Dashboard SHALL apply light mode as the default theme.

---

### Requirement 6: Technical and Structural Constraints

**User Story:** As a developer, I want the codebase to follow strict structural and technology constraints, so that the app remains maintainable, portable, and free from dependencies.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no external frameworks, libraries, or build tools; no scripts or stylesheets SHALL be loaded from external origins or CDNs.
2. THE Dashboard SHALL contain exactly one CSS file located at `css/style.css`.
3. THE Dashboard SHALL contain exactly one JavaScript file located at `js/app.js`.
4. THE Dashboard SHALL function correctly in the latest stable release of Chrome, Firefox, Edge, and Safari available at the time of delivery, using only web platform features with baseline support across all four browsers, without vendor-prefixed or experimental APIs.
5. THE Dashboard SHALL load and have all interactive event listeners attached in under 2 seconds when served over a connection with a minimum download throughput of 25 Mbps and round-trip latency not exceeding 20 ms.
6. THE Dashboard SHALL render all widgets without overlapping, clipping, or horizontal scrolling at viewport widths from 320 px to 2560 px.
7. WHILE the Dashboard is displayed on a viewport narrower than 768 px, THE Dashboard SHALL stack widgets vertically in a single column.
8. THE Dashboard SHALL use only the browser's Local Storage API for data persistence; no cookies, IndexedDB, or network requests SHALL be initiated at any point during Dashboard operation.
