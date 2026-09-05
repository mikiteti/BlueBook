# Editor, rendering, input, and UI reference

## Editor factory

`new Editor({wrapper, interactive, file} = {})` -> `Editor` — Builds `.editor` with spacer, textarea, placeholder, and info elements under `wrapper`; stores `file?.id`. **Side effects:** appends editor DOM.

`newEditor({file, wrapper = document.querySelector("main"), layout = window.state.settings.keyboard, interactive = true} = {})` -> `Editor` — Creates `Editor`, then document, parses marks, renderer, initial full render, and (when interactive) input. **Side effects:** all editor model/DOM subcomponents.

## Rendering (`editor/render/`)

`new Render(editor)` -> `Render`; `newRender({editor})` -> `Render`.

- `renderInfo()` -> `void` — Updates left/right info panels from keyboard state, selection and document statistics. **Side effects:** info DOM.
- `placeElement(line)` -> `void` — Inserts a rendered line at its visual position. **Side effects:** editor textarea DOM.
- `createLineElement(line)` -> `HTMLElement` — Creates the line wrapper/text element and associates it with `line`. **Side effects:** line element reference.
- `renderAll(scrollY = editorElement.scrollTop)` -> `void` — Renders every visible line and selection. **Side effects:** rendered DOM; may unrender lines outside viewport.
- `handleDM(line)` -> `Promise<void>` — Typesets display math with MathJax when the line needs it. **Side effects:** line DOM/MathJax output.
- `createAttachmentElement(url)` -> `Promise<HTMLElement>` — Creates view/image attachment wrapper, buttons, and preview image. **Side effects:** network/DOM.
- `handleLink(line)` -> `Promise<void>` — Recognizes `view/` or normal links and prepares link/attachment DOM. **Side effects:** line DOM and potentially network.
- `unrenderLine(line)` -> `void` — Removes a line's DOM while retaining model data. **Side effects:** DOM/line element state.
- `renderLine(line, {scrollY} = {})` -> `Promise<void>` — Incrementally rebuilds one dirty line, applies decorations/marks, math/link handling, and caret/selection needs. **Side effects:** line DOM and dirtiness state.
- `hideLine(line)` / `revealLine(line)` -> `void` — Toggle rendered visibility. **Side effects:** DOM classes/styles.

`renderChangedLines(editor, changedLines)` -> `void` delegates each line to rendering; `renderCarets(editor)` -> `void` repositions carets. Both mutate DOM.

### Selection

`new Selection(editor)` -> `Selection`.

- `setRanges(ranges = [])` -> `void` — Replaces all selection ranges. **Side effects:** range collection/render DOM.
- `addRange(ranges)` / `removeRange(ranges)` -> `void` — Adds/removes ranges. **Side effects:** range collection/render DOM.
- `renderRanges(line)` -> `void` — Computes and draws selection rectangles for one line. **Side effects:** selection DOM.

`filterRects(rects)` -> `DOMRect[]` removes redundant geometry rectangles; no mutation.

## Carets (`editor/input/caret.js`)

`new SingleCaret(editor, index?, options?)` is an individual cursor/selection endpoint pair (created internally by `Caret`). Its normal cursor is `position`. Starting a selection adds `fixedEnd`, an anchored tracked position. The moving position can cross that anchor; the caret's `from` and `to` normalize their order for commands, selection painting, and replacements. This lets mouse drags, Vim visual mode, and multicaret selections share the same implementation.

- `createElement(editor = this.editor)` -> `HTMLElement` — Creates its visible caret element. **Side effects:** editor DOM.
- `placeAt(index = this.position.index, {updateScreenX = true, hideMath = true, keepFixedEnd = false})` -> `Promise<void>` — Places caret by document position and rendered geometry, retaining selection endpoint as requested. **Side effects:** position, caret DOM, math visibility.
- `addFixedEnd(index = this.position.index)` / `removeFixedEnd()` -> `void` — Begin/end a selection. **Side effects:** tracked positions and selection.
- `switchEnds()` -> `void` — Swaps active/fixed selection endpoint. **Side effects:** caret positions.
- `delete()` -> `void` — Removes DOM and tracked endpoints. **Side effects:** DOM/positions.

`new Caret(editor, {autoRender = true, style = "bar"})` -> `Caret` — Owns multi-caret collection.

- `changeStyle(style, {keepFixedEnd = -1})` -> `void` — Applies style and repositions all carets. **Side effects:** caret DOM/state.
- `forAll(callback)` -> `void` — Calls callback for every individual caret.
- `placeAllAt(newPos = pos => pos.index, options)` -> `Promise<void>` — Repositions every caret. **Side effects:** caret/selection DOM.
- `changeForAll(getChange, getPos, options)` -> `void` — Applies an edit/move calculation to all carets. **Side effects:** caller-defined edits and carets.
- `addCaret(index)` / `removeCaret(index)` -> `void` — Adds/removes a cursor. **Side effects:** collection, endpoints, DOM.
- `updateCarets(positions)` -> `void` — Replaces locations/count from position list. **Side effects:** collection and DOM.

`checkOverlappingCarets(editor)` -> `void` merges conflicts; `hideMath(editor, changedLines)` -> `void` hides typeset math around edits. Both mutate editor rendering.

## Keyboard and snippets

`new Input(editor, layout = window.state.settings.keyboard)` -> `Input` — Creates keyboard/caret/snippet objects and event listeners. **Side effects:** global keyboard, pointer, focus, copy/paste/scroll listeners.

`newKeyboard({editor, layout})` -> `Keyboard`; `new Keyboard(editor, layout)` -> `Keyboard` selects regular or Vim command set.

- `command(event)` -> `function | undefined` — Resolves a key event to command behavior. No direct mutation until caller invokes returned function.
- `changeState(newState, oldState)` -> `void` — Notifies command set about selection/mode changes. **Side effects:** potentially Vim mode.

Regular `createCommandSet(editor)` -> `{run(event)}` maps normalized modifier keys to `state.commands[*].hotkey`; `run` returns the matched command function.

Vim `createCommandSet(editor)` -> `{run(event), changeState(newState,oldState)}` maintains command tokens and modes. `run` returns a ready-to-run action when a command sequence is complete; it supports normal/insert/replace/visual modes, counts, motions, operators, registers, search/find, marks, indentation, line decoration, undo, and snippets. **Side effects:** parser state (`curMode`, `curCommand`) and, after the returned action runs, document/history/carets/rendering. `Keyboard.curMode` and `Keyboard.curCommand` are read-only views of that state.

`new Snippets({editor = window.editor, snippets, snippetVariables})` -> `Snippets`. Snippets are central to scientific editing: a short context-sensitive trigger is expanded after typing into a TeX/prose template, then tracked ranges turn its meaningful fields into Tab-navigable tabstops. Equal placeholder variables are linked, allowing all appearances to be edited together. Default examples include exponent, derivative, Greek-letter, bracket/accent, matrix, and symbol expansions.

- `parseTabstops(to = "")` -> `Tabstop[]` — Finds placeholder tabstops in snippet text.
- `checkEnvironment(pos, wanted)` -> `boolean` — Tests document context for a snippet rule.
- `handleDocChanges(at, {newChangeGroup = true})` -> `void` — Expands/reconciles snippets after an edit. **Side effects:** document, caret, history, tabstop ranges.
- `multiHandle(positions)` -> `void` — Applies snippet handling to multiple carets. **Side effects:** same.
- `jumpToNextTabStops()` -> `void` — Selects next tabstop(s). **Side effects:** carets/selections.
- `deleteTabStops()` -> `void` — Removes tabstop tracking. **Side effects:** ranges.

`getFeatures(editor, options)` -> feature map computes contextual insertion features. `DefaultSnippets` and `DefaultSnippetVariables` in `default.js`/`unicode.js` are data/configuration constructors consumed by `Snippets`.

## UI (`ui/`)

`new UI(state = window.state)` -> `UI` — Binds static modal roots, installs listeners, commands, and fuzzy finders. **Side effects:** global UI events/DOM.

- `initListeners()` -> `void` — Installs modal, focus, pointer, keyboard and resize handlers. **Side effects:** document/window listeners.
- `openModal(modal)` -> `Promise<void>` — Shows modal and overlay; records current modal/focus. **Side effects:** DOM, UI focus/modal state.
- `closeModal()` -> `Promise<void>` — Hides active modal/overlay and restores editor focus. **Side effects:** DOM/UI state.
- `focusEditor()` -> `void` — Focuses hidden input and active editor. **Side effects:** browser focus.
- `alert(title, text)` -> `void` — Displays disposable alert. **Side effects:** alert DOM/timer.
- `prompt(title, description, fields)` -> `Promise<string[]>` — Opens field prompt and resolves entered values. **Side effects:** modal DOM/focus.
- `initTooltipHandler()` -> `void` — Installs hover tooltip behavior. **Side effects:** listeners and tooltip DOM.

`new FuzzyFinder(...)` represents a modal list provider. Its `loadContent()` -> `Promise<Entry[]>` refreshes entries; `open()` -> `Promise<void>` loads and opens it; `close()` -> `void` closes it. **Side effects:** network/UI DOM as provider requires.

`initFuzzyFinders(state)` -> finder registry. It creates file picker/explorer/restorer, command palette, and attachment picker; `handleFuzzySearch()` filters/reorders DOM entries and changes active selection. **Side effects:** modal DOM and state-driven file/attachment commands.
