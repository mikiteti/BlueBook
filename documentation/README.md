# BlueBook frontend reference

This is a source-level reference for the BlueBook browser client as it exists in this checkout. BlueBook is a fast, minimal, keyboard-first scientific note-taking application. Its design centers on keeping editing immediate and predictable: every action has a keyboard route, Vim mode is available for modal editing, and snippets make TeX-heavy equation entry practical. It covers application-owned JavaScript, HTML, and the frontend/backend boundary. Bundled **MathJax**, **Desmos**, fonts, and images are dependencies rather than part of the supported frontend API.

## Product model

BlueBook is deliberately **not a Markdown editor**. A heading, display equation, list, or bold expression is stored as structured line decoration or inline mark, then rendered directly. The text the reader sees is the text being edited—there is no hidden punctuation syntax to remember, no Markdown delimiter to leak into a cursor movement, and no delayed conversion from source text into a different-looking document. This is why a `Line` has `decos` and `marks`, rather than recognizing formatting from typed Markdown characters.

Math is a first-class use case. Inline and display math are rendered with MathJax, while the document retains editable TeX. Snippets expand short triggers into TeX templates and place one or more linked tabstops inside them: pressing Tab selects the next intended field, and repeated placeholders can be edited together. For example, the welcome note describes `eex` expanding to an exponent template, `der` to a derivative, `;a` to a Greek letter, and `3mat` to a matrix. Snippets can also transform ordinary prose symbols such as `=>` into `⇒`.

The client is plain ES modules—there is no build step or framework runtime. `index.html` loads the MathJax and Desmos bundles, creates the static modal containers, and imports `state/state.js`. Importing that module constructs the one global `State` instance.

## Reading guide

| File | Purpose |
| --- | --- |
| [architecture.md](architecture.md) | Startup, ownership, persistent format, and the full keypress-to-pixels path. |
| [state-and-api.md](state-and-api.md) | `State`, UI commands, and every HTTP endpoint used or exposed by the backend. |
| [document-model.md](document-model.md) | The balanced line tree, edits, positions, marks, history, clipboard, and export helpers. |
| [editor-ui.md](editor-ui.md) | Editor construction, rendering, carets, keyboard modes, snippets, UI, and fuzzy finders. |
| [attachments-and-tools.md](attachments-and-tools.md) | Desmos and external-file attachments, plus export helpers. |
| [presentation.md](presentation.md) | HTML shell, CSS responsibilities, and bundled assets. |

## Documentation conventions

Each callable is presented as `name(parameters) -> result`. `void` means the function intentionally has no useful return value. `Promise<T>` resolves to `T`. **Side effects** lists changes that happen outside the passed arguments: document/tree state, caret state, DOM, browser storage, network resources, or globals. A parameter with `?` is optional; an `=` shows its default.

`Position` indexes are document offsets. A `Line` owns `text.length + 1` character slots: the extra slot is the logical newline/end-of-document sentinel. This convention is central to edit ranges and caret placement.

## Source map

- `state/`: application lifecycle, remote files, commands, and attachment editing.
- `editor/doc/`: canonical editable state; everything else derives from it.
- `editor/render/`: incremental DOM presentation plus viewport virtualization.
- `editor/input/`: focus proxy, physical keyboard interpretation, carets, registers, and snippets.
- `ui/`: generic modal, prompt, alert, tooltip, and list-selection controls.
- `native/`: optional module that binds Tauri-specific features when BlueBook is hosted in its native shell.

## Scope notes

The command and Vim modules are declarative command tables as well as code. Their individual key branches are described by behavior rather than listing each table node: the stable callable interface is `createCommandSet(editor).run(event)`.
