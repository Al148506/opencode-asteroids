# Agent Instructions

## Project Shape

- This is a dependency-free HTML5 Canvas game; there is no package manifest, bundler, framework, or build step.
- `index.html` is the browser entrypoint and loads `game.js`; keep the canvas element id (`canvas`) in sync with the script.
- `game.js` contains all game state, entities, input handling, update logic, rendering, and the `requestAnimationFrame` loop.
- The playable coordinate space is fixed at `800x600` (`W`/`H` in `game.js`); movement wraps at its edges.
- User-facing HUD and overlay text is Spanish, so preserve that language when changing visible text.

## Development

- Run locally with `npx serve .`, then open `http://localhost:3000`; opening `index.html` directly also works.
- There are no automated tests, lint, typecheck, or formatting commands. Verify gameplay changes manually in a browser.
- Test the keyboard controls after input changes: ArrowLeft/ArrowRight rotate, ArrowUp thrusts, and Space fires or restarts after game over.
- Preserve the plain-script setup: do not introduce imports, generated files, or dependency/build configuration without an explicit need.
