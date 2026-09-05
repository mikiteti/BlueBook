# Architecture and lifecycle

## Boot sequence

1. `index.html` configures `window.MathJax` and `window.DesmosLoaded`, then loads local MathJax and Desmos bundles.
2. It supplies a hidden `#focus` text input, `<main>`, and modal roots. The hidden input is the browser's IME/keyboard focus target; visible text is not a native textarea.
3. `state/state.js` imports dependencies and executes `new State()` as a module side effect.
4. `State` restores settings/registers from `localStorage`, builds `UI`, starts `/user/get`, records the URL's `note` query parameter, and defines convenience getters: `window.editor`, `doc`, `render`, `selection`, `input`, `caret`, and `snippets`.
5. UI initialization fetches file metadata and opens either the requested note or the built-in welcome file. (The `UI` constructor wires the initial commands and fuzzy finders.)

There is one active `state.editor`, but `State.editors` caches constructed editors. `openFile` hides non-active editor DOM trees instead of destroying them.

## Ownership graph

```text
State
 ├─ UI ── fuzzy finders / modals / commands
 ├─ files, user, clipboard, registers
 └─ active Editor
     ├─ Doc ── Change, History, Line tree
     ├─ Render ── Selection and rendered-line DOM
     └─ Input ── Keyboard, Caret, Snippets
```

`Doc` is the source of truth. The renderer may destroy an off-screen line's DOM node; it never removes that `Line` from the document tree. Carets and marks use tracked `Position` objects, which are adjusted by document changes.

## Core editing concepts

**Formatting is structural, not Markdown.** A line can carry block decorations such as `h1`, `math`, or `link`; a span of text can carry marks such as `bold`, `italic`, `underline`, or inline `math`. The source text stays clean while the model retains enough formatting data to render and export faithfully.

**Snippets are live edit templates.** After an insertion, `Snippets.handleDocChanges` examines the nearby text and its context (for example, whether the caret is in inline math). A matching trigger is replaced by its template. Placeholder fields become tracked ranges; Tab advances each caret to the next range, and multiple occurrences of the same placeholder can be updated as one. This makes equation entry fast without making the editor a raw LaTeX or Markdown surface.

**A selection is one caret with two endpoints.** Every `SingleCaret` has an active `position`; once selection begins, it also has `fixedEnd`. The active endpoint moves with motions or typing, while `fixedEnd` stays anchored, so `from` and `to` are always the ordered pair regardless of drag direction. Removing the fixed end collapses the selection. This model also supports multicaret editing: `Caret` manages multiple `SingleCaret` instances, each potentially with its own fixed end.

**Marks have deliberately meaningful ends.** A mark owns two tracked `Position`s, not merely a start/end number. When the caret is exactly at either boundary and the user toggles that mark's hotkey, BlueBook changes that endpoint's `stickLeftOnInsert` flag. The two boundary character positions do not move; rather, the caret is switched into or out of the mark's typing affinity. Subsequent typing at that exact boundary either makes the mark grow with the newly inserted text or leaves the mark where it was. This is how a user can decide whether text typed next to a bold, italic, underline, or inline-math run belongs inside it without adding visible syntax or moving the caret across a character.

**Smart properties are cached tree summaries.** `chars`, `lines`, `words`, and `text` are calculated on demand from children; `height` is calculated from visual children. Each node/line has logical `_updates` and visual `_visual_updates` version counters. A getter recomputes only when the version it last saw differs from the relevant counter, then retains the result. `update()` increments both counters and propagates upward after text/tree changes; `visualUpdate()` increments only the visual counter after layout/decoration changes. This is why API entries call out those counters as side effects: they invalidate cached summaries rather than eagerly recomputing the whole document.

## Keypress to visible character

1. `Input` listens for document `keydown`, keeps `#focus` focused, and ignores events when a modal owns focus.
2. It prevents the browser's normal text insertion and delegates to `Keyboard.command(event)`.
3. `Keyboard` selects a command set according to `settings.keyboard`: the regular set maps hotkeys to `State.commands`; the Vim set parses a stateful command tree and maintains a mode (`n`, `i`, `v`, `vLine`, or `R`).
4. An insert action calls `Doc.change.insert(string, index, options)` (or `replace`). `Change` updates the B-tree-like line hierarchy, shifts tracked positions, records undo data, and queues line callbacks.
5. Callback processing tells `Render` which lines have unrendered text/deco/mark/caret changes. `Render.renderLine` rebuilds or patches the line element, runs MathJax where needed, and manages embedded links/attachments.
6. `Caret.placeAllAt` converts each document offset to a visual line/x coordinate with the rendered DOM and positions the caret elements. `Selection.renderRanges` draws selection rectangles.

Thus the character on screen is browser-rendered HTML, not text inserted into the focus input. The hidden input exists only to receive keyboard, clipboard, and mobile/IME-compatible focus behavior.

## Other important flows

### Formatting a line or range

1. A command hotkey or Vim command reaches the command table.
2. For a block action, the command changes the current line's `decos` set; for inline formatting it calls `Doc.toggleMark(role)`.
3. A selected range becomes a `Mark`. At a collapsed caret, `toggleMark` either creates a collapsed mark, removes/enlarges a containing mark, or changes an endpoint's insertion affinity as described above.
4. The line becomes visually dirty, a history snapshot is recorded, and the renderer rebuilds the relevant markup. The original typed text is never rewritten into Markdown tokens.

### Rendering, wrapping, and scrolling

1. A `Line` carries model text plus formatting metadata, while `Render` owns the corresponding DOM only when it needs to be present.
2. `renderLine` turns the line into DOM, applies block decorations and inline mark elements, then performs any asynchronous MathJax or attachment work.
3. The renderer measures visual height and writes it back through the smart-property path. The document root then adjusts the editor's scrollable surface height.
4. On scrolling, `isLineInViewport` decides which line DOM can remain. Off-screen line elements can be removed; their line text, marks, positions, history, and cached tree relationship stay intact. When revisited, the DOM is reconstructed from the model.
5. Caret placement uses the current line's rendered text-node geometry, so wrapped visual rows and formatted spans still map back to one document offset.

### Math input and display

1. Inline math is an inline `math` mark; display math is a line-level `math` decoration. Both preserve TeX text in the document model.
2. A relevant edit makes the line dirty. When the renderer sees display math, it asks MathJax to typeset the TeX to SVG; inline math follows the corresponding inline rendering path.
3. The renderer/caret code can temporarily hide math around an edit so DOM measurement and caret positioning remain stable, then restores the typeset result. The stored note never replaces TeX with SVG.

### Attachment creation and editing

1. A create-graph, geometry, or upload command asks the backend to allocate attachment storage (or uploads the external file).
2. For a built-in graph/geometry attachment, BlueBook inserts a `view/<url>` line into the note and decorates it as a link. The renderer recognizes that special line and creates a preview wrapper with edit controls.
3. Opening edit mode creates an `AttachmentEditor`, fetches saved attachment content, and embeds the matching Desmos calculator in the fullscreen attachment modal. The calculator is an editor inside the note, not text inside the document line.
4. Finishing retrieves the calculator state and an SVG screenshot. For an interactive note it sends both to the backend; locally it swaps the preview image to a blob URL and returns focus to the note.
5. On later render, `/view/<url>` provides the stored preview. The document keeps only the stable URL reference, so attachment content remains independently editable and shareable.

### Saving, reopening, undoing, and pasting

1. Saving calls `exportFile`, which serializes each line's text, tabs, decorations, and marks. The backend stores this content and separate metadata.
2. Reopening rebuilds a tree of raw `Line` records, then `parseMarks` creates tracked mark positions once their document offsets can be resolved.
3. Each edit records a before/after snapshot in a grouped `History` entry. Undo/redo replays text, caret, decoration, and mark snapshots with normal render callbacks suppressed until the group is coherent.
4. Copying captures plain text plus line decorations and contained marks. Pasting first inserts/replaces the text, then reapplies its block/inline formatting and rerenders the affected lines. The system clipboard also receives HTML and plain text for use outside BlueBook.

## Persisted note format

`State.saveFile` sends `JSON.stringify(exportFile(editor))`. Exported content is an array of line records:

```json
{ "text": "A line", "tabs": { "full": 0 }, "decos": ["h1"], "marks": [{ "from": 0, "to": 1, "role": "bold", "stickLeft": [false, false] }] }
```

Offsets in `marks` are document offsets in memory when exported by a line; `newDoc` reconstructs lines first and `Doc.parseMarks()` turns the stored objects into tracked `Mark` instances. Note metadata (`misc`) is separate and contains at least size and timestamps. The backend stores both fields as JSON strings.

## Rendering rules and dependencies

- Decorations (`Line.decos`) control block roles such as headings, lists, quotes, math, code, link, and image/view lines.
- Marks (`Mark.role`) control inline roles such as bold, italic, underline, and math.
- MathJax waits on `MathJax.startup.promise` before editor creation; render work that invokes MathJax is asynchronous.
- A line beginning `view/<attachment-url>` is rendered as an attachment/image link. Desmos graph and geometry attachments have editable state stored remotely and SVG previews served through `/view/:url`.

## Boundaries

The backend is authoritative for authentication, files, attachment records, uploads, image delivery, and PDF compilation.
