# Document model reference

The editable document is a balanced, ordered tree. `Doc` contains `Node`s, which contain `Leaf`s, which contain `Line`s. `nodeSizes` in `editor/assets.js` controls initial/min/max fan-out.

## Smart properties and invalidation

A smart property is a lazily cached summary. On a `Node`, `chars`, `lines`, `words`, and `text` are derived from children; `height` is derived from their visual heights. On a `Line`, the corresponding values derive from its text and rendered element. A property records the current version counter when it is computed. On the next access it returns the cached value if the counter matches, otherwise it recomputes and replaces the cache.

There are two independent invalidation paths. `_updates` represents a logical change—text, tree shape, character positions—and invalidates both logical and visual smart properties. `_visual_updates` represents a presentation-only change—such as a decoration, tab depth, or measured height—and invalidates visual properties only. `update()` and `visualUpdate()` increment the appropriate counter and propagate to ancestors, so reading `doc.chars` or `doc.height` remains correct without every edit walking the entire tree immediately. `Doc.height` additionally calls `heightChangeCallback` when its computed result changes, resizing the editor surface.

## Tree classes (`editor/doc/classes.js`)

### `Node`

`new Node({editor, parent?, children = []})` -> `Node` — Generic internal tree node. Assigns every supplied child to this parent.

- `update()` -> `void` — Invalidates logical and visual cached values and propagates to the parent. **Side effects:** `_updates`, `_visual_updates`, ancestors.
- `visualUpdate()` -> `void` — Invalidates visual caches only and propagates. **Side effects:** `_visual_updates`, ancestors.
- `delete()` -> `void` — Marks node deleted, removes it from its parent, empties children, then invalidates. **Side effects:** tree structure and parent caches.
- `assignParent(parent)` -> `void` — Sets `parent`. **Side effects:** this node.
- `addChild(child, index = -1)` -> `void` — Appends or inserts child and assigns its parent. **Side effects:** child array and `child.parent`.
- `prependChild(child)` -> `void` — Intended to prepend child and assign parent. **Side effects:** tree; implementation calls nonstandard `unsift`, so this path requires an extension/fix to succeed.
- `Lines` (getter) -> `Line[]` — Flattens descendants to leaf lines.
- `isTooSmall` / `isTooLarge` (getters) -> `boolean` — Compare child count with node-size bounds.
- `previousSibling` / `nextSibling` (getters) -> `Node | Line | null | undefined` — Nearest depth-first neighbor; null for deleted/no adjacent descendant, undefined at document boundary.

Cached getters: `chars` (sum of child character slots), `lines`, `words`, `text` (children joined by newline), and visual `height` (sum; invokes `heightChangeCallback` if changed).

### `Leaf`

`new Leaf(...nodeArgs)` -> `Leaf` — A `Node` whose children are lines and whose size bounds come from `nodeSizes.leaf`. No additional methods.

### `Doc`

`new Doc(...nodeArgs)` -> `Doc` — Root node. Creates `history`, `change`, unbounded size, and tracked-position count.

- `heightChangeCallback()` -> `void` — Coalesces height changes (100 ms guard) and schedules textarea height adjustment. **Side effects:** editor spacer/textarea DOM and timer field.
- `parseMarks()` -> `void` — Converts each line's persisted mark data to `Mark` objects. **Side effects:** line mark collections and tracked positions.
- `line(lineNum)` -> `Line` — Clamps a line number then descends by subtree line counts.
- `lineAt(index)` -> `Line` — Clamps a character position then descends by character counts; end positions choose last line.
- `lineAtHeight(height)` -> `Line` — Clamps a visual y offset and descends by cached heights.
- `linesBetween(line1, line2)` -> `Line[]` — Exclusive, ordered intermediate lines; accepts either order.
- `charAt(index)` -> `string` — Character at index, returning a space for a logical line-end sentinel.
- `textBetween(from, to)` -> `string` — Half-open document text range, inserting newline separators across lines.
- `toggleMark(role)` -> `void` — Adds/removes/extends the inline role around each caret selection or insertion boundary; ignores multiline selections. **Side effects:** marks, history, render dirtiness, and caret placement.

### `Line`

`new Line({editor, parent?, text = "", tabs = {full:0}, decos = [], marks = []})` -> `Line` — Leaf text record. `decos` becomes a `Set`; marks remain raw until parsing.

- `assignParent(parent)` -> `void` — Sets parent. **Side effects:** line.
- `parseMarks()` -> `void` — Replaces raw mark objects with `Mark`s. **Side effects:** marks and position tracking.
- `update(text = "")` -> `void` — Replaces text and marks its visual representation dirty. **Side effects:** line text/caches and parent caches.
- `visualUpdate()` -> `void` — Invalidates visual cache and parents. **Side effects:** cache counters.
- `delete()` -> `void` — Deletes all marks, removes line from tree, then invalidates. **Side effects:** tree, marks, positions.
- `addPosition(position)` / `removePosition(position)` -> `void` — Maintain sorted tracked positions. **Side effects:** `positions`.
- `number` (getter) -> `number | undefined` — Current zero-based document line number.
- `assignElement(element)` -> `void` — Associates rendered DOM element. **Side effects:** `element`.
- `snapshotDecos()` / `snapshotMarks()` -> `object` — History-ready line state including caret snapshot.
- `addDeco(deco, {addToHistory = true})` -> `void` — Adds one/many block decorations. **Side effects:** decoration set, render dirtiness, visual caches, optionally history.
- `removeDeco(deco, options)` -> `void` — Removes one/many decorations; same side effects.
- `toggleDeco(deco, options)` -> `void` — Toggles one/many decorations; same side effects.
- `setDecos(decos, options)` -> `void` — Makes decoration set match list; same side effects.
- `setTabs(type, number)` -> `void` — Sets a nonnegative tab depth. **Side effects:** `tabs`, render dirtiness, visual caches.
- `exportMarks()` -> `MarkRecord[]` — Serializes marks with stick-left behavior.
- `addMark(mark, options)` / `addNewMark(record, options)` -> `void` — Adds existing/new `Mark` objects. **Side effects:** marks, dirtiness, optional history.
- `removeMark(mark, options)` -> `void` — Detaches a mark and endpoints. **Side effects:** marks, positions, optional history.
- `deleteMark(markOrMarks, options)` -> `void` — Removes and deletes marks. **Side effects:** marks, positions, render dirtiness, optional history.
- `setMarks(records, options)` -> `void` — Replaces marks from serialized records. **Side effects:** marks, positions, dirtiness, optional history.
- `checkMarks()` -> `void` — Sorts/merges overlapping same-role marks and resolves cross-role insertion behavior. **Side effects:** marks and positions.
- `from` / `to` (getters) -> `number` — Start and inclusive logical end (including newline slot).
- `verticalOffset` (getter) -> `number` — Y position from cumulative preceding line heights.
- `Lines`, `previousSibling`, `nextSibling` (getters) — Line-level counterparts of `Node` getters.

Cached line getters are `chars = text.length + 1`, `words`, `height` (measured DOM height), and `text` is ordinary mutable data.

### Positions, ranges, and marks

`new Position(pos, doc = window.doc, {stickWhenDeleted = true, stickLeftOnInsert = false, caret?, track = true})` -> `Position` — Tracked document offset. If `track`, registers with its line. `stickLeftOnInsert` determines which side of an insertion at the exact offset this endpoint follows; `stickWhenDeleted` controls its behavior when its surrounding content disappears.

- `assign(pos)` -> `void` — Moves to valid clamped location and manages line registration. **Side effects:** position and line position lists.
- `reassign(pos)` -> `void` — Updates offset during a document transformation and invokes attached range/caret callbacks. **Side effects:** position/range/caret state.
- `delete()` -> `void` — Untracks this position. **Side effects:** line positions and `deleted`.
- `addToRange(range, pair)` -> `void` — Associates endpoint role (`from`/`to`) for callbacks. **Side effects:** range association.

`new Range(editor, from, to, {role = "selection"})` -> `Range` — Two tracked positions plus semantic role. A caret selection uses the same two-endpoint idea: its moving `position` and its anchored `fixedEnd`; its public `from`/`to` are the ordered endpoints, so reverse selections require no special range format.

- `reassignCallback(pos, lastIndex)` -> `void` — Keeps counterpart/range semantics coherent when an endpoint moves. **Side effects:** range endpoints.
- `delete()` -> `void` — Deletes both endpoints. **Side effects:** positions and `deleted`.

`new Mark(editor, {from, to, role = "math", stickLeft})` -> `Mark` — A styled inline `Range`; `stickLeft` configures endpoint insertion affinity.

At a mark's exact start or end, toggling its role is not necessarily a request to delete it. `Doc.toggleMark` flips that endpoint's `stickLeftOnInsert` flag. This preserves the same two character boundaries while choosing whether the caret is logically inside or outside the mark for later insertion: text typed at the boundary either extends the mark or remains unmarked. It is the model-level mechanism behind predictable “type into / type out of formatting” behavior.

- `delete({addToHistory = true})` -> `void` — Removes itself through its line. **Side effects:** marks, endpoints, optionally history.
- `reassign(from, to, {changedTo} = {})` -> `void` — Moves both endpoints, maintaining line membership. **Side effects:** endpoints and mark state.

## Editing and undo

### `Change`

`new Change(editor)` -> `Change` — Document mutation coordinator with a callback queue.

- `addCallback(callback)` -> `void` — Queues a post-change callback. **Side effects:** callback list.
- `runCallbacks(callbackList = this.callbackList)` -> `void` — Runs queued work then clears/completes it. **Side effects:** renderer/caret work triggered by callbacks.
- `emptyCallbackList()` -> `Callback[]` — Removes and returns current callback list. **Side effects:** queue.
- `completeCallbackList(callbackList)` -> `void` — Runs supplied callback list. **Side effects:** callback effects.
- `delete(from, to = from + 1, {noCallback = false, markStickLeft = false, addToHistory = true})` -> `void` — Removes a half-open range, joins/splits/rebalances tree nodes, moves positions/marks, and records undo. **Side effects:** document text/tree, positions, marks, history, render callbacks.
- `insert(string, at, {noCallback = false, stickLeft = false, preserveDM = true, addToHistory = true})` -> `void` — Inserts text/newlines at offset, creates/rebalances lines, shifts positions, and records undo. **Side effects:** same domains as `delete`.
- `replace(text, from, to = from, options)` -> `void` — Deletes range then inserts text as one edit. **Side effects:** document, positions, history, rendering.
- `multiInsert(inserts)` -> `void` — Applies `{at,string}` insertions, highest index first. **Side effects:** document and normal insert side effects.
- `noCallback(change)` -> `void` — Runs a change while suppressing immediate callbacks, then restores queue handling. **Side effects:** documents per nested change.

`newHistory(editor)` -> `History` and `newChange({editor})` -> `Change` are factories.

### `History`

`new History(editor)` -> `History` — Initializes grouped changes and current group position.

- `parseChange(changeGroup, {reverse = true})` -> `() => void` — Builds an executable undo/redo closure for text, caret, decorations, marks, and line-mark snapshots.
- `undo()` / `redo()` -> `void` — Applies preceding/following nonempty group. **Side effects:** document/caret/render; history cursor.
- `addChange(change)` -> `void` — Drops redo tail, records change. **Side effects:** history groups.
- `newChangeGroup()` -> `void` — Starts a nonempty logical undo group. **Side effects:** history cursor/groups.

## Clipboard

`new Clipboard(name)` -> `Clipboard`; `newClipboard(name)` -> `Clipboard`.

- `editor` (getter) -> active `Editor`.
- `parse(from,to)` -> `{text,decos,marks}` — Captures text and wholly-contained line formatting.
- `copy(from?,to?, {text?,clipboard?})` -> content — Sets content from a range/text/register. Window clipboard additionally writes HTML and plain text. **Side effects:** internal content, browser clipboard.
- `append(from?,to?, options)` -> `void` — Appends content and offsets incoming mark positions. **Side effects:** internal content.
- `update()` -> `Promise<void>` — Reads window clipboard and adopts plain text when it differs. **Side effects:** browser clipboard read/content.
- `paste(at?, content = this.content, {from?,to?})` -> `Promise<void>` — Inserts/replaces then restores decorations/marks and rerenders affected lines. **Side effects:** document, history, rendering, clipboard read.
- `compare(text, content = window.state.clipboard.content)` -> `boolean` — Plain-text equality.
- `convertToClipboardHTML(content)` -> `string` — Converts heading/math decorations and supported inline marks to HTML.
