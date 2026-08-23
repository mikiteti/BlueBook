import endpoints from "./endpoints.js";
import initMenu from "./menu.js";

class Native {
    constructor(state) {
        this.state = state;

        this.request = endpoints;

        initMenu(state);
    }
}

export default Native;
