import endpoints from "./endpoints.js";
import initMenu from "./menu.js";
import { fetch } from "@tauri-apps/plugin-http";

class Native {
    constructor(state) {
        this.state = state;

        this.request = endpoints;

        initMenu(state);

        this.fetch = fetch;
    }
}

export default Native;
