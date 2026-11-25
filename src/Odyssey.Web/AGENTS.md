# Agent Instructions: Odyssey.Web

Host project and the game. The root `AGENTS.md` applies here too, including the Change policy, Code style, and blank-line rules.

## Build and test
- Install frontend packages: `npm install` in `src/Odyssey.Web/wwwroot` (`package.json` and `Gruntfile.js` are there). The first build does it automatically.
- Building the project runs Grunt automatically: `npx grunt debug` for Debug and `npx grunt release` for Release (except when publishing).
  Release bundles `App/main.js` with esbuild into `App/build/main-built.js`, which `index.cshtml` loads outside Development.
- Run web app: `dotnet run --project src/Odyssey.Web`
- The Grunt build runs jshint (`npx grunt jshint`) and fails the whole project build on any warning, so run it after changing JavaScript.
  jshint rejects a line break before an operator: when splitting a ternary or a logical expression, end the line with `?`, `:`, `&&` or `||` instead of starting the next line with it.
- Frontend tests use Jasmine and can be run by opening `/Tests/test-runner.html` in a browser while the app runs in Development.

## Stack
- Plain JavaScript ES modules, no framework and no runtime dependencies. Canvas 2D for rendering, Pointer Events and keyboard for input.
- Build tooling: Grunt (Gruntfile.js), jshint, htmlhint, LESS, esbuild.

## JavaScript style
- Declare variables with `const`, or with `let` when the variable is reassigned. Never use `var`.
- Prefer arrow functions (`() =>`) whenever a function is passed as an argument, such as callbacks and promise handlers.
  Use `function` only when the callback depends on the `this` its caller provides.
- Prefer `async`/`await` to promise chains whenever possible.
- Prefer optional chaining (`?.`) to `&&` guards where applicable, such as `obj?.prop` instead of `obj && obj.prop`.
- Use classes for engine components. Prefix members that are private to the class with `_` and place them at the bottom of the class.
- Do not use class fields or `#private` members; initialize properties in the constructor (jshint does not parse them).

## Conventions
- Engine modules go in `App/engine/`, overlays and the cursor in `App/engine/ui/`, game content in `App/game/`.
- Game content must only talk to the engine through the script api (`g`) and the definition format in `docs/AUTHORING.md`.
- Coordinates in content and engine are logical pixels (320x200 screen); never use buffer or device pixels outside `display.js`.
- Images go in `wwwroot/Assets/` and are referenced by paths relative to it. A `@2x` variant next to an image is used by the `hires` profile.
- `wwwroot/App/build/` and `Styles/site.css` are generated. Do not edit them by hand.
