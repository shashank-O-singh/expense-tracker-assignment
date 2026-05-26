## Why

Personal finance tracking is essential for keeping budget discipline. There is currently no local tool to log expenses, view spending by category, and track the remaining monthly budget. This change introduces a self-contained, offline-first web application to manage expenses instantly.

## What Changes

- Add a semantic, responsive dashboard UI (`index.html`) using custom SVG icons and progress bars.
- Add modern, glassmorphism CSS stylesheets (`styles.css`) featuring custom responsive grid layouts and animations.
- Add client-side logic (`app.js`) to support adding/deleting transactions, searching/filtering, and calculating category aggregates.
- Integrate browser-local storage for state persistence.

## Capabilities

### New Capabilities

- `expense-management`: Log expenses with name, amount, category, and date; display live total spend and remaining budget calculations; filter and search logged history; persist data locally.

### Modified Capabilities

*None.*

## Impact

- Creates a new standalone client-side application.
- Utilizes browser local storage APIs.
- Does not affect any existing codebase systems or backends.
