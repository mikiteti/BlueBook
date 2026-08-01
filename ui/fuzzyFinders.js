import { parseHotkey, key, fuzzyFind } from "../editor/assets.js";

class FuzzyFinder {
    constructor({
        state,
        placeholder,
        getEntries,
        convertEntryToHTML,
        onClick,
        fillTop = function() { this.element.querySelector(".top").innerHTML = "" },
        fillBottom = function() { this.element.querySelector(".bottom").innerHTML = "" },
    } = {}) {
        this.state = state;
        this.placeholder = placeholder;
        this.getEntries = () => {
            this.entries = getEntries();
            return this.entries;
        };
        this.convertEntryToHTML = convertEntryToHTML;
        this.onClick = onClick;
        this.element = state.UI.fuzzyFinder;
        this.fillTop = fillTop.bind(this);
        this.fillBottom = fillBottom.bind(this);
    }

    loadContent() {
        this.element.querySelector("input").placeholder = this.placeholder;
        this.element.querySelector("input").value = "";
        this.element.querySelector("input").focus();
        this.element.querySelector(".list").innerHTML = this.getEntries()
            .map(e => this.convertEntryToHTML(e))
            .join("");
        this.fillTop();
        this.fillBottom();
        this.state.UI.fuzzyFinders.handleFuzzySearch();
    }

    async open() {
        this.state.UI.currentModal = this;
        this.loadContent();

        this.state.UI.openModal(this.element);
    }

    close() {
        this.state.UI.closeModal();
    }
}

const initFuzzyFinders = state => {
    state.UI.currentModal = undefined;

    const closeModal = () => {
        state.UI.currentModal.close();
    };

    const filePicker = new FuzzyFinder({
        state,
        placeholder: "Find or create notes...",
        getEntries: () => state.files?.filter(e => !e.misc?.deleted).sort((e, f) => e.name.localeCompare(f.name)).concat(state.systemFiles),
        convertEntryToHTML: e => `<div item-id="${e.id}">${e.name}</div>`,
        onClick: async entry => {
            await state.openFile({ id: entry.id });
            closeModal();
        }
    });

    const commandPalette = new FuzzyFinder({
        state,
        placeholder: "Search and execute commands",
        getEntries: () => state.commands,
        convertEntryToHTML: e =>
            `<div class="item" item-id="${e.id}">
                <span>${e.name.includes(":") ? `<span class="">${e.name.slice(0, e.name.indexOf(":") + 1)}</span><span>${e.name.slice(e.name.indexOf(":") + 1)}</span>` : e.name}</span>
                ${e.hotkey ? `<span class="hotkey">${parseHotkey(e.hotkey)}</span>` : ``}
            </div>`,
        onClick: entry => {
            closeModal();
            state.runCommand(entry);
        }
    });

    state.pwd = "";
    const fileExplorer = new FuzzyFinder({
        state,
        placeholder: "Search for stuff in this folder",
        getEntries: () => {
            if (state.files == undefined) return [];
            let pwd = state.pwd || "";
            let filesInPwd = state.files.filter(e => !e.misc?.deleted && e.name.startsWith(pwd));
            let folders = [
                ...new Set(
                    filesInPwd
                        .map(e => e.name.slice(pwd.length))
                        .filter(e => e.indexOf("/") != -1)
                        .map(e => e.slice(0, e.indexOf("/") + 1))
                )
            ].map(e => ({
                type: "folder",
                id: Math.random(),
                name: e,
                files: filesInPwd.filter(f => f.name.startsWith(pwd + e)),
            }));
            let files = filesInPwd
                .filter(e => e.name.slice(pwd.length).indexOf("/") == -1)
                .map(e => ({ id: e.id, name: e.name.slice(pwd.length).split("/")[0] }));

            return [...folders, ...files];
        },
        convertEntryToHTML: e => {
            if (e.type === "folder") {
                return `<div item-id="${e.id}">
                    <div style="all: unset">${e.name}</div><br/>
                    <span class="info">${e.files.length + (e.files.length > 1 ? " files" : " file")}</span>
                </div>`;
            }

            let file = window.state.files.find(f => f.id == e.id);
            let info = [];
            // if (file.misc?.created) info.push("Created " + new Date(file.misc.created).toLocaleString());
            if (file.misc?.created) info.push(new Date(file.misc.created).toLocaleString());
            // if (file.misc?.last_modified) info.push("Last modified " + new Date(file.misc.last_modified).toLocaleString());
            if (file.misc?.size) info.push(`L${file.misc.size.l} W${file.misc.size.w} C${file.misc.size.c}`);
            info = info.join(" – ");

            return `<div item-id="${e.id}">
                <div style="all: unset">${e.name.slice(e.name.lastIndexOf("/") + 1)}</div><br/>
                <span class="info">${info}</span>
            </div>`;
        },
        onClick: async entry => {
            if (entry.type === "folder") {
                state.pwd += entry.name;
                fileExplorer.loadContent();
                return;
            }

            await state.openFile({ id: entry.id });
            closeModal();
        },
        fillTop: function() {
            this.element.querySelector(".top").innerHTML = `<div class="actions">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left contentButton goback">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M15 6l-6 6l6 6" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-folder-symlink contentButton">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 21v-4a3 3 0 0 1 3 -3h5" />
                    <path d="M8 17l3 -3l-3 -3" />
                    <path d="M3 11v-5a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-edit contentButton newFile">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                    <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" />
                    <path d="M16 5l3 3" />
                </svg>
                <svg style="color: var(--color-red)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-trash contentButton delete">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M4 7l16 0" />
                    <path d="M10 11l0 6" />
                    <path d="M14 11l0 6" />
                    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                </svg>
            </div>`;

            this.element.querySelector(".top .goback").addEventListener("click", (e) => {
                if (state.pwd) state.pwd = state.pwd.slice(0, state.pwd.slice(0, -1).lastIndexOf("/") + 1);
                this.loadContent();
            });

            this.element.querySelector(".top .newFile").addEventListener("click", (e) => {
                let input = document.createElement("input");
                let div = document.createElement("div");
                div.classList.add("active");
                div.appendChild(input);

                for (let el of this.element.querySelectorAll(".list > div")) el.classList.remove("active");
                this.element.querySelector(".list").appendChild(div);
                input.focus();

                input.addEventListener("keydown", async (e) => {
                    if (e.key == "Enter") {
                        await state.createFile({ name: state.pwd + input.value });
                        await state.reload(["files"]);
                        this.loadContent();
                    }
                });
            });

            this.element.querySelector(".top .delete").addEventListener("click", async (e) => {
                let entry = this.entries.find(f => f.id == this.element.querySelector(".list .active").getAttribute("item-id"));
                if (entry.type == "folder") return state.UI.alert("Deleting entire folders is not allowed at the moment.");

                await state.commands.find(f => f.codename == "delete_note").run(entry.id);
                await state.reload(["files", "currentFile"]);
                this.loadContent();
            });
        },
        fillBottom: function() {
            this.element.querySelector(".bottom").innerHTML = `<div style="display: flex; flex-wrap: wrap"></div>`;
            let pwd = state.pwd;
            if (pwd == undefined || pwd == "") return;

            this.element.querySelector(".bottom div").innerHTML = `<span class='contentButton navigationButton'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-home">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
                </svg>/
            </span>`;
            this.element.querySelector(".bottom div span.navigationButton").addEventListener("click", (e) => {
                state.pwd = "";
                this.loadContent();
            });

            let folders = pwd.split("/").map(e => e + "/").slice(0, -1);
            let dir = "";
            for (let folder of folders) {
                let el = document.createElement("span");
                el.classList.add("contentButton", "navigationButton");
                el.innerHTML = folder;
                dir += folder;
                el.setAttribute("target", dir);
                el.addEventListener("click", (e) => {
                    state.pwd = e.target.getAttribute("target");
                    this.loadContent();
                });
                this.element.querySelector(".bottom div").appendChild(el);
            }
        }
    });

    const fileRestorer = new FuzzyFinder({
        state,
        placeholder: "Restore files here",
        getEntries: () => state.files?.filter(e => e.misc?.deleted).sort((e, f) => e.name.localeCompare(f.name)),
        convertEntryToHTML: e => `<div item-id="${e.id}">${e.name}</div>`,
        onClick: async entry => {
            await state.restoreFile(entry.id);
            await state.reload(["files"]);
            fileRestorer.loadContent();
        },
        fillTop: function() {
            this.element.querySelector(".top").innerHTML = this.entries.length == 0
                ? "<span>No more deleted files left to restore</span>"
                : "";
        }
    });

    const handleFuzzySearch = () => {
        let matches = fuzzyFind(state.UI.fuzzyFinder.querySelector("input").value, state.UI.currentModal.entries).map(e => e.id);
        let entries = state.UI.fuzzyFinder.querySelector(".list").children;
        let activeDone = false;
        for (let el of entries) {
            el.classList.remove("active");
            el.classList.add("nodisplay");
        }
        for (let m of matches) {
            let el = state.UI.fuzzyFinder.querySelector(`.list [item-id="${m}"]`);
            if (el == undefined) continue;
            el.classList.remove("nodisplay");
            state.UI.fuzzyFinder.querySelector(".list").appendChild(el);
            if (!activeDone && matches.find(e => e == el.getAttribute("item-id"))) {
                el.classList.add("active");
                activeDone = true;
            }
        }
    };

    state.UI.fuzzyFinder.querySelector("input").addEventListener("input", handleFuzzySearch);

    state.UI.fuzzyFinder.addEventListener("click", async e => {
        if (!e.target.matches(".list div")) return;

        console.log(state.UI.currentModal.entries.map(f => f.id), e.target.getAttribute("item-id"), e.target);
        let selectedEntry = state.UI.currentModal.entries.find(f => f.id == e.target.getAttribute("item-id"));
        state.UI.currentModal.onClick(selectedEntry);
    });

    state.UI.fuzzyFinder.querySelector("input").addEventListener("keydown", async e => {
        if (e.key === "Escape") {
            closeModal();
            document.getElementById("focus").focus();
            return;
        }

        if (e.key === "Enter") {
            if (!key.metaKey(e)) state.UI.fuzzyFinder.querySelector(".list div.active").click();

            return;
        }

        if (!key.metaKey(e) && !["ArrowUp", "ArrowDown"].includes(e.key)) return;
        if (["ArrowDown", "j"].includes(e.key)) {
            e.preventDefault();
            let displayed = state.UI.fuzzyFinder.querySelectorAll(".list > div:not(.nodisplay)");
            for (let i = 0; i < displayed.length; i++) {
                if (i < displayed.length - 1 && displayed[i].classList.contains("active")) {
                    displayed[i].classList.remove("active");
                    displayed[i + 1].classList.add("active");
                    return;
                }
            }
        }
        if (["ArrowUp", "k"].includes(e.key)) {
            e.preventDefault();
            let displayed = state.UI.fuzzyFinder.querySelectorAll(".list > div:not(.nodisplay)");
            for (let i = 0; i < displayed.length; i++) {
                if (i > 0 && displayed[i].classList.contains("active")) {
                    displayed[i].classList.remove("active");
                    displayed[i - 1].classList.add("active");
                    return;
                }
            }
        }
    });

    return { filePicker, commandPalette, fileExplorer, handleFuzzySearch, fileRestorer };
};

export default initFuzzyFinders;
