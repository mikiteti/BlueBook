import { exportToMD, exportToPdf } from "../editor/assets.js";
import Environment from "../environment.js";
import AttachmentEditor from "./editAttachments.js";

const newCommands = (state) => {
    const vars = {
        get editor() { return state.editor },
        get caret() { return state.editor.input.caret },
        get carets() { return state.editor.input.caret.carets },
        get render() { return state.editor.render },
        get doc() { return state.editor.doc },
        get UI() { return state.UI },
        get history() { return state.editor.doc.history },
    };

    const createAttachment = async (type) => {
        let res = await state.sendRequest("attachment/new", {
            method: 'POST',
            body: JSON.stringify({ type }),
            headers: { "Content-Type": "application/json" },
            credentials: 'include'
        });
        if (res == -1) return;
        let url = (await res.json()).url;
        let caret = vars.carets[0], lineNum;
        if (caret.position.Line.text.trim() == "") {
            lineNum = caret.position.Line.number;
            vars.doc.change.insert("view/" + url, caret.position.index);
        } else {
            lineNum = caret.position.Line.number + 1;
            vars.doc.change.insert("\nview/" + url, caret.position.Line.to);
        }

        state.UI.attachments.querySelector(".grid").innerHTML = "";

        vars.doc.line(lineNum).addDeco("link");
        requestAnimationFrame(() => {
            let wrapper = vars.doc.line(lineNum).element.imgWrapper;
            wrapper.classList.add("notReady");
            new AttachmentEditor({ type, url, wrapper, isNew: true });
        });
    }

    const toggleMark = (mark) => {
        vars.history.newChangeGroup();
        vars.doc.toggleMark(mark);
        vars.history.newChangeGroup();
    }

    const toggleDeco = (deco) => {
        vars.history.newChangeGroup();
        vars.caret.forAll(pos => {
            pos.Line.toggleDeco(deco);
            vars.render.renderLine(pos.Line);
        });
        vars.caret.placeAllAt();
        vars.history.newChangeGroup();
    }

    const toggleExclusiveDeco = (deco) => {
        vars.history.newChangeGroup();
        vars.caret.forAll(pos => {
            pos.Line.removeDeco(vars.render.decos);
            if (deco != undefined) pos.Line.addDeco(deco);
            vars.render.renderLine(pos.Line);
        });
        vars.caret.placeAllAt();
        vars.history.newChangeGroup();
    }

    return [
        {
            name: "Open File Explorer",
            codename: "open>explorer",
            run: () => {
                vars.UI.fuzzyFinders.fileExplorer.open();
            }
        },
        {
            name: "Open File Picker",
            codename: "open>picker",
            run: () => {
                vars.UI.fuzzyFinders.filePicker.open();
            }
        },
        {
            name: "Create user",
            run: async () => {
                let [email, name, password] = await vars.UI.prompt("Create user", "Input your email, name and password to create an account", { Email: "john@doe.com", Name: "John Doe", Password: "Secret123" });
                let res = await state.sendRequest("user/new", {
                    method: 'POST',
                    body: JSON.stringify({ email, name, password }),
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include'
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);
                vars.UI.alert(text);

                state.commands.find(e => e.name === "Login").run(email, password);
            }
        },
        {
            name: "Login",
            run: async (email, password) => {
                if (email == undefined || password == undefined) [email, password] =
                    await vars.UI.prompt("Login", 'Input your email and password to log in', { "Email": "john@doe.com", "Password": "Secret123" });
                console.log(email, password);
                localStorage.setItem('email', email);
                localStorage.setItem('password', password);

                let res = await state.sendRequest("user/login", {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                    headers: { 'Content-Type': 'application/json' },
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);
                vars.UI.alert("Welcome", `You are now logged in`);
                state.reload(["user", "files", "currentFile", "editors"]);
            }
        },
        {
            name: "Restore deleted files",
            codename: "file>restore",
            run: () => {
                state.UI.fuzzyFinders.fileRestorer.open();
            }
        },
        {
            name: "Delete file",
            codename: "file>delete",
            run: async (id = window.editor.fileId) => {
                if (id == undefined) id = vars.editor.fileId;

                let res = await state.sendRequest("note/update", {
                    method: 'POST',
                    body: JSON.stringify({ id, misc: JSON.stringify({ deleted: true }) }),
                    headers: { "Content-Type": "application/json" }
                });
                let text = await res.text();
                console.log(text);

                state.reload(["files", "currentFile"]);
                return text;
            }
        },
        {
            name: "Rename file",
            codename: "file>rename",
            run: async () => {
                let [name] = await vars.UI.prompt("Rename file", 'Input the new filename', { "Filename": state.files.find(e => e.id == vars.editor.fileId)?.name || "" });
                let res = await state.sendRequest("note/update", {
                    method: 'POST',
                    body: JSON.stringify({ id: vars.editor.fileId, name }),
                    headers: { "Content-Type": "application/json" }
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);
                vars.UI.alert("Renamed", `Your file is now ${name}`);

                state.reload(["files"]);

                return text;
            }
        },
        {
            name: "Export to Markdown",
            codename: "file>export>md",
            run: async () => {
                let text = await exportToMD(vars.editor);
                if (!text) {
                    vars.UI.alert("Error", "Something went wrong with the export");
                    return;
                }
                navigator.clipboard.writeText(text).then(() => {
                    console.log('Copied!', text);
                }).catch(console.error);
                vars.UI.alert("Exported", "Your file has been copied to your clipboard");
            },
            // hotkey: "M+e",
        },
        {
            name: "Export to Pdf (uses Pandoc)",
            codename: "file>export>pdf",
            run: async () => {
                vars.UI.alert("Compiling", "This may take a while");
                let text = await exportToPdf(vars.editor);
                if (!text) {
                    vars.UI.alert("Error", "Something went wrong with the export");
                    return;
                }
                vars.UI.alert("Exported", "Your file has been downloaded");
            },
        },
        {
            name: "Reload file",
            codename: "file>reload",
            run: () => {
                state.reload(["file", "currentFile"]);
            }
        },
        {
            name: "New file",
            codename: "file>new",
            run: async () => {
                let [fileName] = await vars.UI.prompt("New file", "Input the filename in the box below", { Filename: "My new file" });

                await state.openFile(await state.createFile({ name: fileName }));
                vars.UI.focusEditor();
            },
            hotkey: "M+t",
        },
        {
            name: "Copy note URL",
            codename: "file>copy",
            run: async () => {
                let url = new URL(window.location);
                let noteUrl = state.getCurrentNoteUrl();
                if (noteUrl == undefined) {
                    vars.UI.alert("Something went wrong", "The note may not have shareable a URL.");
                    return;
                }
                url.searchParams.set("note", noteUrl);

                navigator.clipboard.writeText(url.href).then(() => {
                    console.log('Copied!', url.href);
                    vars.UI.alert("URL copied", "Now you can share it with anyone. They will be able to see your note, but they won't be able to write to it.");
                }).catch(() => {
                    vars.UI.alert("Something went wrong with copying to your clipboard.", "Here is the URL though: " + url.href);
                });
            }
        },
        {
            name: "Save file",
            codename: "file>save",
            run: () => {
                state.saveFile(vars.editor);
            },
            hotkey: "M+s",
        },
        {
            name: "New Desmos Graph",
            run: () => { createAttachment("graph") }
        },
        {
            name: "New Desmos Geometry",
            run: () => { createAttachment("geometry") }
        },
        {
            name: "List attachments",
            run: async () => {
                if (vars.UI.attachments.querySelector(".grid").children.length == 0) {
                    let attachments = await state.getAttachments();

                    let images = [];
                    for (let i of attachments) {
                        images.push(vars.render.createAttachmentElement("view/" + i.url))
                    }
                    images = await Promise.all(images);
                    for (let img of images) {
                        let wrapper = document.createElement("div");
                        wrapper.classList.add("wrapper");
                        wrapper.appendChild(img.element);
                        vars.UI.attachments.querySelector(".grid").appendChild(wrapper);
                    }
                }

                vars.UI.openModal(vars.UI.attachments);
            }
        },
        {
            name: "Toggle Vim Mode",
            run: () => {
                let currentMode = state.settings.keyboard;
                let goalMode = currentMode == "vim" ? "regular" : "vim";
                state.settings.keyboard = goalMode;
                if (goalMode == "vim")
                    vars.UI.alert("Vim mode switched on", "Reload for the changes to take place.");
                else vars.UI.alert("Vim mode switched off", "Reload for the changes to take place.");
            }
        },
        {
            name: "Toggle Reading Mode",
            run: () => {
                state.settings.interactive = !state.settings.interactive;
                if (state.settings.interactive)
                    vars.UI.alert("Reading mode switched off", "Reload for the changes to take place.");
                else vars.UI.alert("Reading mode switched on", "Reload for the changes to take place.");
            }
        },
        {
            name: "Toggle Welcome Message",
            run: () => {
                state.settings.welcomeMessage = !state.settings.welcomeMessage;
                if (state.settings.welcomeMessage)
                    state.UI.alert("Welcome message turned on", "Reload for the changes to take place.");
                else state.UI.alert("Welcome message turned off", "Reload for the changes to take place.");
            }
        },
        {
            name: "Toggle Line Numbers",
            run: () => {
                state.settings.lineNumbers = !state.settings.lineNumbers;
                if (state.settings.lineNumbers) document.documentElement.classList.add("lineNumbers");
                else document.documentElement.classList.remove("lineNumbers");
                queueMicrotask(() => {
                    vars.caret?.placeAllAt();
                });
            },
            hotkey: ["M+n", "M+S+n"],
        },
        {
            name: "Toggle Relative Line Numbers",
            run: () => {
                state.settings.relNumbers = !state.settings.relNumbers;
                if (state.settings.relNumbers) document.documentElement.classList.add("relNumbers");
                else document.documentElement.classList.remove("relNumbers");

                if (state.settings.lineNumbers) document.documentElement.classList.add("lineNumbers");
                else document.documentElement.classList.remove("lineNumbers");
                queueMicrotask(() => {
                    vars.caret?.placeAllAt();
                });
            }
        },


        {
            name: "Copy",
            codename: "edit>copy",
            run: () => {
                let from, to;
                if (!vars.carets[0].fixedEnd) {
                    from = vars.carets[0].position.Line.from;
                    to = vars.carets[0].position.Line.to + 1;
                } else {
                    from = vars.carets[0].from;
                    to = vars.carets[0].to;
                }
                state.clipboard.copy(from, to);
            },
            hotkey: "M+c",
        },
        {
            name: "Paste",
            codename: "edit>paste",
            run: async () => {
                await state.clipboard.update();
                for (let sc of vars.carets) state.clipboard.paste(sc.position.index);
            },
            hotkey: ["M+v", "M+S+v"],
        },
        {
            name: "Increase indent Level",
            codename: "edit>indent",
            run: () => {
                if (vars.editor.input.snippets.tabstops.length > 0) {
                    vars.editor.input.snippets.jumpToNextTabStops();
                    return;
                }

                let indentedLines = [];
                vars.caret.placeAllAt(pos => {
                    let line = pos.Line;
                    if (indentedLines.includes(line)) return;
                    indentedLines.push(line);

                    line.setTabs("full", line.tabs.full + 1);
                    vars.render.renderLine(line);
                });
            },
            hotkey: "Tab",
        },
        {
            name: "Decrease Indent Level",
            codename: "edit>unindent",
            run: () => {
                let indentedLines = [];
                vars.caret.placeAllAt(pos => {
                    let line = pos.Line;
                    if (indentedLines.includes(line)) return;
                    indentedLines.push(line);

                    line.setTabs("full", line.tabs.full - 1);
                    vars.render.renderLine(line);
                })
            },
            hotkey: "S+Tab",
        },
        {
            name: "Format Selection: Toggle Link",
            codename: "format>mark>link",
            hotkey: "M+l",
            run: () => { toggleMark("link") }
        },
        {
            name: "Format Line: Toggle Link",
            codename: "format>line>link",
            hotkey: "M+S+l",
            run: () => { toggleDeco("link") }
        },
        {
            name: "Format Selection: Toggle Math",
            codename: "format>mark>math",
            hotkey: "M+m",
            run: () => { toggleMark("math") }
        },
        // {
        //     name: "M+S+m",
        //     run: () => { toggleDeco("math") }
        // },
        {
            name: "Format Line: Toggle Math",
            codename: "format>line>math",
            hotkey: ["M+d", "M+S+m"],
            run: () => { toggleDeco("math") }
        },
        {
            name: "Format Selection: Toggle Underline",
            codename: "format>mark>underline",
            hotkey: "M+u",
            run: () => { toggleMark("underline") }
        },
        {
            name: "Format Line: Toggle Underline",
            codename: "format>line>underline",
            hotkey: "M+S+u",
            run: () => { toggleDeco("underline") }
        },
        {
            name: "Format Selection: Toggle Bold",
            codename: "format>mark>bold",
            hotkey: "M+b",
            run: () => { toggleMark("bold") }
        },
        {
            name: "Format Line: Toggle Bold",
            codename: "format>line>bold",
            hotkey: "M+S+b",
            run: () => {
                vars.history.newChangeGroup();
                vars.caret.forAll(pos => {
                    if (!pos.Line.decos.has("bold") && !pos.Line.decos.has("Bold")) pos.Line.addDeco("bold");
                    else if (pos.Line.decos.has("bold")) {
                        pos.Line.removeDeco("bold");
                        pos.Line.addDeco("Bold");
                    } else if (pos.Line.decos.has("Bold")) {
                        pos.Line.removeDeco("Bold");
                    }
                    vars.render.renderLine(pos.Line);
                });
                vars.caret.placeAllAt();
                vars.history.newChangeGroup();
            }
        },
        {
            name: "Format Selection: Toggle Italic",
            codename: "format>mark>italic",
            hotkey: "M+i",
            run: () => { toggleMark("italic") }
        },
        {
            name: "Format Line: Toggle Italic",
            codename: "format>line>italic",
            hotkey: "M+S+i",
            run: () => { toggleDeco("italic") }
        },
        {
            name: "Format Selection: Toggle Highlight",
            codename: "format>mark>highlight",
            hotkey: "M+h",
            run: () => { toggleMark("highlight") }
        },
        {
            name: "Format Line: Toggle Highlight",
            codename: "format>line>highlight",
            hotkey: "M+S+h",
            run: () => { toggleDeco("highlight") }
        },
        {
            name: "Format Selection: Toggle Border",
            codename: "format>mark>border",
            // hotkey: "M+w",
            run: () => { toggleMark("spin_border") }
        },
        {
            name: "Format Line: Toggle Border",
            codename: "format>line>border",
            // hotkey: "M+S+w",
            run: () => { toggleDeco("spin_border") }
        },
        {
            name: "Format Line: Toggle Center",
            codename: "format>line>center",
            hotkey: "M+S+c",
            run: () => { toggleDeco("center") }
        },
        {
            name: "Format Line: Remove Decorations",
            codename: "format>line>remove",
            hotkey: ["M+0", "M+S+0"],
            run: () => { toggleExclusiveDeco() }
        },
        {
            name: "Format Line: Make 1st Level Heading",
            codename: "format>line>h1",
            hotkey: "M+S+a",
            run: () => { toggleExclusiveDeco("h1") }
        },
        {
            name: "Format Line: Make 2nd Level Heading",
            codename: "format>line>h2",
            hotkey: "M+S+s",
            run: () => { toggleExclusiveDeco("h2") }
        },
        {
            name: "Format Line: Make 3rd Level Heading",
            codename: "format>line>h3",
            hotkey: "M+S+d",
            run: () => { toggleExclusiveDeco("h3") }
        },
        {
            name: "Format Line: Make 4th Level Heading",
            codename: "format>line>h4",
            hotkey: "M+S+f",
            run: () => { toggleExclusiveDeco("h4") }
        },
        {
            name: "Format Line: Make Subtitle",
            codename: "format>line>subtitle",
            hotkey: "M+S+g",
            run: () => { toggleExclusiveDeco("subtitle") }
        },
        {
            name: "Upload attachment",
            codename: "attachment>upload",
            run: () => {
                let input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*,.pdf";
                input.addEventListener("change", async () => {
                    const file = input.files[0];
                    if (file == undefined) return;

                    const form = new FormData();
                    form.append("file", file);

                    form.append("metadata", JSON.stringify({
                        name: file.name,
                    }));

                    let res = await state.sendRequest("attachment/upload", {
                        method: 'POST',
                        body: form,
                        credentials: 'include'
                    });
                    if (res === -1) return;
                    let url = (await res.json())?.url;
                    console.log(url);

                    vars.UI.alert("Attachment uploaded", "You can find it from now on among your attachments.")
                });
                input.click();
            }
        }
    ]
}

export default newCommands;
