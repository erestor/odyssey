# Agent Instructions

## Project Overview

Odyssey is a point and click adventure game in the style of the early 90s LucasArts adventures (Monkey Island, Fate of Atlantis, The Dig), built with:
- **Frontend**: a custom engine in plain JavaScript ES modules, rendering to a 320x200 canvas (VGA mode 13h) scaled up with sharp pixels
- **Host**: an ASP.NET Core 10 project that only serves static files; the game has no server logic and no server database
- **Storage**: IndexedDB for save games, localStorage for settings
- **Build Tools**: Grunt for linting and LESS, esbuild for the release bundle

## Key Components

Using Odyssey.slnx solution file:

- `Odyssey.Web` - ASP.NET Core host (`Program.cs`, `Pages/index.cshtml`) and the game in `wwwroot`

Frontend-specific instructions are in `src/Odyssey.Web/AGENTS.md`. The format of game content (rooms, objects, actors, items, dialogs, scripts) is described in `docs/AUTHORING.md`.

## Build and test
- Prerequisites: .NET 10 SDK, Node.js and npm.
- Build: `dotnet build Odyssey.slnx` (runs `npm install` on the first build and Grunt on every build, see `src/Odyssey.Web/AGENTS.md`)
- Run: `dotnet run --project src/Odyssey.Web` and open http://localhost:5380
- Tests: open http://localhost:5380/Tests/test-runner.html while the app runs in Development.

## Change policy
- Keep changes as non-intrusive as possible. Change only what the task requires.
- Do not refactor, rename, reformat, or reorder unrelated code, and do not modify unrelated files.
- Follow the coding patterns already used in the surrounding file and neighboring modules. Mirror their naming, structure, and test setup instead of introducing new patterns.
- Do not add packages or dependencies unless the task requires them.
- Always add an empty line after a multi-line statement, such as a declaration of several variables split across lines (for example `const a = …,` followed by `b = …;`) or a chained call split across lines. Do not add the empty line when the multi-line statement itself ends with a brace (such as an object literal ending in `};`) or when the next line is a closing brace.

## Code style
- Adhere to existing code patterns.
- Avoid code repetition.
- Use tabs (width 4) and CRLF line endings. Follow .editorconfig.
- Start comments with lowercase unless they comprise multiple sentences. Omit the space between `//` and the text.
- Keep lines under 140 characters long in most cases, but allow slightly longer lines where code readability would be disrupted by the line break.
- Never reformat existing code.
- Always use braces around multi-line blocks, even if they contain only one statement. Omit braces for single-line blocks.
- C#: prefer `var` in declarations, omit accessibility modifiers, place private members at the bottom of a class and omit the `private` keyword.

## Architecture

### Engine (`wwwroot/App/engine`)
- The game works in 320x200 logical pixels at all times (`config.js`). Render profiles (`vga`, `hires`) only change the scale of the back buffer
  and which asset variants are loaded (`bg.png` or `bg@2x.png`), so higher resolution art can be added later without touching game logic.
- `game.js` owns the main loop (fixed 60 Hz update, render every animation frame), routes input to overlays first and then to the world,
  and runs scripts. `api.js` is the only interface game content uses (`g` in scripts).
- `room.js` holds no game state. Everything that changes lives in `GameState` (`state.js`): room, flags, inventory, actor positions, dialog progress.
  New state must go there, otherwise it is not saved.
  A room with `map: true` is a map: the player is not placed in it and clicks on its objects act without walking.
- `rules.js` holds the interface rules that need no screen (which handler a click runs, item combinations, available dialog options),
  so they can be tested. `validate.js` checks the references in the game content; `game.js` logs its problems at startup.
- `pathfinding.js` finds paths over a walk area (outer polygon with holes) using a visibility graph and A*.
- `text.js` and `font.js` render text with a built-in 5x8 bitmap font; accented letters are composed from base glyphs and marks, so Czech and other
  Latin scripts work without extra glyphs.
- `ui/` contains overlays (menus, inventory, dialog choices) and the cursor. An overlay has `update`, `handle(event)`, `draw(context)`,
  and the flags `pauses` (stops the world) and `covers` (hides the hover label and inventory button),
  and optionally `showsHeldItem` (keeps the held item as the cursor while the overlay is open).

### Game content (`wwwroot/App/game`)
- Data and scripts only, no engine code. `index.js` is the game definition.
- Placeholder art is painted in code with `engine/paint.js`; every painter can later be replaced by an image path under `wwwroot/Assets`.

## Tests
- Use Jasmine (`wwwroot/Tests`). Each test file is an ES module imported by `test-runner.html`; add new files there.
- Test pure engine modules (geometry, pathfinding, text, state, rules, actor, room, storage). `content.tests.js` runs `validateGame` on the real
  game definition, so broken references in the story fail the test run. Name specs as `method condition result` sentences, for example `findPath walks around a hole`.
- If a test is 5 lines or shorter, do not insert any blank lines.
