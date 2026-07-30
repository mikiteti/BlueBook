import { parseHotkey, key, fuzzyFind } from "../editor/assets.js";

class FuzzyFinder {
    constructor({ state, placeholder, getEntries, convertEntryToHTML, onClick } = {}) {
        this.state = state;
        this.placeholder = placeholder;
        this.getEntries = () => {
            this.entries = getEntries();
            return this.entries;
        };
        this.convertEntryToHTML = convertEntryToHTML;
        this.onClick = onClick;
        this.element = state.UI.fuzzyFinder;
    }

    async open() {
        this.state.UI.currentModal = this;
        this.element.querySelector("input").placeholder = this.placeholder;
        this.element.querySelector("input").value = "";
        this.element.querySelector(".list").innerHTML = this.getEntries()
            .map(e => this.convertEntryToHTML(e))
            .join("");
        this.state.UI.fuzzyFinders.handleFuzzySearch();

        this.state.UI.openModal(this.element);
    }

    reload() {
        this.element.querySelector("input").placeholder = this.placeholder;
        this.element.querySelector("input").value = "";
        this.element.querySelector(".list").innerHTML = this.getEntries()
            .map(e => this.convertEntryToHTML(e))
            .join("");
        this.state.UI.fuzzyFinders.handleFuzzySearch();
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
            ].map(e => ({ type: "folder", id: Math.random(), name: e }));
            let files = filesInPwd.filter(e => e.name.slice(pwd.length).indexOf("/") == -1);

            return [...folders, ...files];
        },
        convertEntryToHTML: e => {
            if (e.type === "folder") return `<div item-id="${e.id}">${e.name}</div>`;
            return `<div item-id="${e.id}">${e.name.slice(e.name.lastIndexOf("/") + 1)}</div>`;
        },
        onClick: async entry => {
            if (entry.type === "folder") {
                state.pwd += entry.name;
                fileExplorer.reload();
                return;
            }

            await state.openFile({ id: entry.id });
            closeModal();
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

        let selectedEntry = state.UI.currentModal.entries.find(f => f.id == e.target.getAttribute("item-id"));
        console.log(selectedEntry, state.UI.currentModal, state.UI.currentModal.entries, e.target.getAttribute("item-id"));
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

        if (!key.metaKey(e)) return;
        if (e.key === "j") {
            e.preventDefault();
            let displayed = state.UI.fuzzyFinder.querySelectorAll(".list div:not(.nodisplay)");
            for (let i = 0; i < displayed.length; i++) {
                if (i < displayed.length - 1 && displayed[i].classList.contains("active")) {
                    displayed[i].classList.remove("active");
                    displayed[i + 1].classList.add("active");
                    return;
                }
            }
        }
        if (e.key === "k") {
            e.preventDefault();
            let displayed = state.UI.fuzzyFinder.querySelectorAll(".list div:not(.nodisplay)");
            for (let i = 0; i < displayed.length; i++) {
                if (i > 0 && displayed[i].classList.contains("active")) {
                    displayed[i].classList.remove("active");
                    displayed[i - 1].classList.add("active");
                    return;
                }
            }
        }
    });

    return { filePicker, commandPalette, fileExplorer, handleFuzzySearch };
};

export default initFuzzyFinders;
