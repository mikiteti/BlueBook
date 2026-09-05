# Attachments, exports, and standalone tools

## How attachments fit into a note

An attachment is a separately stored object referenced by a short URL in a normal BlueBook line. It lets a note embed a visual object—currently a Desmos graph, Desmos geometry construction, or uploaded external file—without forcing the whole object's editable state into note text. A special `view/<url>` line tells the renderer to load its preview and provide an edit affordance.

For graph and geometry attachments, edit mode opens a fullscreen modal with the relevant Desmos calculator. The note line remains the stable link; the backend holds the calculator's serialized state and SVG preview. When the user finishes, BlueBook saves the current calculator state and refreshes the line preview. A reader of a non-interactive shared note sees the rendered attachment but cannot persist edits. A sketch module skeleton exists, but it is not part of the supported attachment workflow.

## `AttachmentEditor` (`state/editAttachments.js`)

`new AttachmentEditor({type, url, wrapper, isNew = false} = {})` -> `Promise<AttachmentEditor>` — Associates the editor with `wrapper`, creates an attachment editor element, then begins asynchronous setup. The constructor deliberately returns `create()`'s promise rather than a synchronous instance.

**Side effects:** sets `wrapper.attachmentEditor`, appends editor DOM to the attachment modal, and may fetch attachment state.

- `create()` -> `Promise<void>` — Fetches `attachment/content` when URL is supplied; creates Desmos GraphingCalculator for `graph` or Geometry for `geometry`; loads persisted state or begins editing for new attachment. **Side effects:** network, Desmos instance, DOM/modal state.
- `startEditing()` -> `void` — Makes the attachment editor active, enters fullscreen when available, opens its modal, and expands Desmos expressions. **Side effects:** wrapper classes/button label, UI focus/modal, `window.state.editedAttachment`, fullscreen, calculator settings.
- `finishEditing()` -> `Promise<void>` — Captures SVG preview and state, conditionally updates the remote attachment when editor is interactive, replaces preview image with a blob URL, exits fullscreen, closes modal. **Side effects:** network, preview DOM/blob URL/fullscreen/UI.
- `setState(state)` -> `Promise<void>` — Restores graph/geometry state to Desmos. **Side effects:** calculator.
- `getState()` -> `Promise<object>` — Collapses expression panel and returns Desmos state. **Side effects:** calculator display settings.
- `getPreview()` -> `Promise<string>` — Requests a 600×450 SVG screenshot from Desmos. **Side effects:** calculator screenshot work.
- `destroy()` -> `void` — Disconnects wrapper, removes editor element, destroys Desmos calculator. **Side effects:** DOM and calculator resources.

## Asset/export helpers (`editor/assets.js`)

These helpers are shared geometry, serialization, and browser-integration utilities. Most have no side effect unless stated.

- `checkTreeStructure(doc)` -> `boolean` — Validates document tree shape/size constraints; logs failures.
- `checkSpeed()` -> `void` — Development timing probe. **Side effects:** console output.
- `getColumnAt(element, x, y, {style = "bar"} = {})` -> `number` — Maps client geometry to text column.
- `getLineBreaks(line, nodes)` -> break descriptors — Locates visual wraps from DOM text nodes.
- `_nodeAt(nodes, index)` / `nodeAt(pos)` -> text-node descriptor — Resolve DOM text node at document position.
- `nodeInLineAtColumn(line,column)` -> descriptor — Resolve within one line, allowing its end sentinel.
- `findXInVisualLine(x,nodes,from,to)` -> column — Finds closest character column in a visual fragment.
- `findXIndicesInLine(x,line)` -> `{from,to,...}` — Finds indices near x across wrapped line.
- `getVisualLineAt(position,editor)` -> visual line descriptor — Resolves visual wrap segment for position.
- `exportFile(editor = window.editor)` -> line records — Serializes the document to persisted content format.
- `getDataUri(link)` -> `Promise<string>` — Fetches a URL and returns a data URI. **Side effects:** network.
- `exportToHTML(editor)` -> `Promise<string>` — Produces standalone HTML from document content; may inline remote assets. **Side effects:** network through asset conversion.
- `hashURL(url)` -> `string` — Deterministic short hash used for identifiers.
- `exportToLaTeX(editor)` -> `Promise<string>` — Converts document to LaTex source; may load assets. **Side effects:** possible network.
- `exportToMD(editor)` -> `Promise<string>` — Converts document to Markdown.
- `saveState()` -> `void` — Persists serializable state to local storage. **Side effects:** `localStorage`.
- `getUrl(link)` -> `string` — Normalizes/resolves link URL.
- `estimateHeight(line)` / `measureHeight(line)` -> `number` — Estimate or measure line height; the latter reads DOM.
- `getViewportMargins()` -> `number` — Current vertical viewport margin.
- `isLineInViewport(line, scrollY = ...)` -> `boolean` — Determines whether a line should remain rendered.
- `snapshotCarets(editor)` -> `number[]` — Captures caret offsets for history.
- `_parseHotkey(hotkey)` / `parseHotkey(hotkey)` -> normalized hotkey descriptor — Parse display/binding syntax.
- `fuzzyFind(string = "", array)` -> `Entry[]` — Scores/filter-sorts list entries.
