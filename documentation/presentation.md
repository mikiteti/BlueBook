# Presentation and packaged assets

## Main document shell

`index.html` is the application entry point. Its only dynamic application import is `state/state.js`; the remaining script tags load local MathJax and Desmos distributions before that module runs. It provides these stable DOM anchors:

| Selector | Owner / role |
| --- | --- |
| `#focus` | `Input`; invisible keyboard/IME focus proxy. |
| `main` | `State`/`Editor`; container for cached editor instances. |
| `#modalBg` | `UI`; shared modal backdrop. |
| `#fuzzyFinder` | `UI`/fuzzy finders; query input and result list. |
| `#attachments` | attachment browsing modal. |
| `#attachmentEditor` | fullscreen attachment editing modal. |
| `#alerts`, `#prompts`, `#tooltip` | transient UI components. |

The `window.MathJax` configuration enables TeX input and SVG output, base/AMS packages, `$...$` inline delimiters, and custom `\\si`/`\\SI` macros. `window.DesmosLoaded` is a promise used by graph/geometry attachments to avoid constructing a calculator before the local Desmos script is ready.

## Stylesheets

- `css/style.css` is the main layout and component stylesheet. It defines the editor's page/line typography, caret/selection geometry, decorations, modal and fuzzy-finder layout, attachment wrapper controls, alerts/prompts/tooltips, and responsive rules.
- `css/dark.css` supplies the active dark palette and CSS variables/overrides.
- `css/light.css` is a light-theme alternative but is commented out in `index.html`.

Styles are class-driven. The key class families are `.editor`, `.textarea`, `.line`, `.deco-*`/block decoration classes, `.caret`/`.selection`, `.modal`, `.fuzzyFinder`, and `.attachmentEditor`. Application code changes classes and attributes; CSS determines visual appearance. No stylesheet changes are needed to understand document persistence or editing semantics.

## Other HTML entry points

- `desmos.html` is a standalone Desmos-hosting page, separate from the main editor.
## Bundled vendor and static files

- `assets/mathjax/` is a checked-in MathJax distribution. It is loaded as vendor code; BlueBook configures but does not implement it.
- `assets/desmos.js` is the Desmos calculator bundle; `AttachmentEditor` calls its public calculator APIs.
- `fonts/` contains the local face files used by CSS (including MathJax font assets).
- `img/` contains favicon, texture, shadow, empty-state, and error imagery.
- `assets/tabler_icons/` contains SVG icon resources.
- `editor/preamble.js` and `editor/preamble2.js` are TeX preamble source strings used by export/compilation flows, not runtime classes.
- `editor/input/snippets/symbols.json` is snippet symbol data. `default.js` and `unicode.js` turn it into the selectable snippet configuration.

The filesystem inclusion of a dependency does not mean application code should be edited there; updates should come from the dependency's own distribution process.
