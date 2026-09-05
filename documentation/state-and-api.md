# State, commands, and HTTP API

## `State` (`state/state.js`)

`new State()` -> `State` — Constructs the application singleton and assigns it to `window.state`.

**Side effects:** reads `localStorage.state`; creates UI, registers, and editor cache; starts a user request; parses the current URL; defines global convenience getters.

- `setNoteUrl(url)` -> `void` — Sets the current note URL and replaces the browser history URL's `note` parameter. **Side effects:** `note_url`, `URL`, browser history.
- `getCurrentNoteUrl()` -> `string | undefined` — Looks up the active editor's `fileId` in `files` and returns its sharing URL. No mutation.
- `sendRequest(url, body)` -> `Promise<Response | -1>` — Sends an application request with credentials. On initial 401/403 it retries after stored-email login. User-facing request failures alert and return `-1`. **Side effects:** network, potentially session login and UI alerts.
- `newEditor(file, {main = true})` -> `Promise<Editor>` — Waits for MathJax, constructs an editor, caches it, selects it if requested, places carets, and fades in its text. **Side effects:** `editors`, possibly `editor`/`UI.focus`, DOM and animations.
- `runCommand(command)` -> `void` — Invokes `command.run()` when supplied. **Side effects:** whatever the selected command performs.
- `createFile(file)` -> `Promise<Note | undefined>` — POSTs `note/new`, fetches the full note, adds it to `files`, and reloads file UI. **Side effects:** remote note creation, local list/UI.
- `getFile({id? , url?})` -> `Promise<Note | -1 | undefined>` — Fetches a note by id or public URL, parses its `content`, and normalizes empty content to one blank line. **Side effects:** network only.
- `openFile(file)` -> `Promise<void>` — Resolves system/new/remote files, reuses or builds an editor, makes it the visible editor, updates URL/title. **Side effects:** DOM visibility, active editor, history URL, document title.
- `saveFile(editor = this.editor)` -> `Promise<string | undefined>` — Serializes editor content and metadata, then POSTs `note/update`. **Side effects:** remote persistence, cached metadata, UI “Saved” alert.
- `getAttachments()` -> `Promise<Attachment[]>` — Loads the authenticated user's attachment summaries into `attachments`. **Side effects:** network and `attachments`.
- `getFiles()` -> `Promise<Note[]>` — Lists own notes, parses each `misc`, optionally obtains the URL-selected note, and sets read-only mode for a shared note. **Side effects:** network and `files`.
- `reload(elements = ["files", "user", "currentFile"])` -> `Promise<void>` — Refreshes requested domains; clearing `editors` also clears `<main>`, then opens the latest viable editor or welcome file. **Side effects:** network, DOM, editor cache, active editor.
- `restoreFile(id)` -> `Promise<string>` — Merges `{deleted:false}` into remote note metadata and reloads files/current note. **Side effects:** remote persistence and UI state.

## Command catalogue

`newCommands(state)` -> `Command[]` creates `{name, codename?, hotkey?, run(...)}` records. The command set includes account creation/login, file create/open/rename/delete/restore/save, Markdown/PDF export, clipboard/register operations, undo/redo, block decorations, inline marks, keyboard-layout switching, and creating/editing graph, geometry, or uploaded image attachments.

The private helpers `createAttachment(type)`, `toggleMark(mark)`, `toggleDeco(deco)`, and `toggleExclusiveDeco(deco)` are invoked by those records. They mutate the current document and history; `createAttachment` also POSTs `attachment/new`, inserts `view/<url>`, and creates an `AttachmentEditor`.

## Backend contract

All JSON POST calls use `Content-Type: application/json`; authenticated calls use the session cookie. `State.sendRequest` interprets 401/403 and HTTP errors as `-1` rather than throwing.

| Endpoint | Request | Successful response / frontend use |
| --- | --- | --- |
| `POST /user/new` | `{email,name,password}` | Text; account creation. |
| `POST /user/login` | `{email,password}` | Text and session cookie. |
| `GET /user/get` | cookie | `{id,email,name,misc}`. |
| `GET /note/list` | cookie | Note summaries `{id,url,name,user_id,misc}`. |
| `POST /note/get` | `{id}` + cookie | Complete note; `content` and `misc` are JSON strings. |
| `POST /note/get/url` | `{url}` | Complete public/shared note, no login required. |
| `POST /note/new` | `{name,url?}` + cookie | `{id}`. |
| `POST /note/update` | `{id,content?,name?,misc?}` + cookie | Text. Metadata is merged server-side. |
| `GET /attachment/list` | cookie | Owned attachment summaries. |
| `GET /attachment/meta/:url` | — | Attachment metadata for any URL. |
| `POST /attachment/content` | `{url}` | Attachment including serialized editor state. |
| `POST /attachment/get` | `{url}` | Complete attachment row. |
| `POST /attachment/new` | `{type,url?}` + cookie | `{url}`. |
| `POST /attachment/update` | `{url,content?,preview?,misc?}` + cookie | Text; updates only supplied truthy fields. |
| `POST /attachment/upload` | multipart `file`, optional JSON `metadata` + cookie | `201 {url}`; accepts JPEG, PNG, GIF, SVG, PDF up to 10 MB. |
| `GET /attachment/isExternal/:url` | — | `{external}`; true when MIME-like `type` contains `/`. |
| `GET /view/:url` | — | SVG preview for internal attachments or stored uploaded file. |
| `GET /proxy-image?url=` | URL | Proxied bytes/content type. |
| `POST /compile` | `{id,markdown}` | PDF bytes from the Pandoc service. |

The backend does not enforce ownership on public note reads or most attachment reads/views; it does enforce it for note updates and attachment updates.
