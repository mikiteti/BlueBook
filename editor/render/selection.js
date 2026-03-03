import { nodeAt } from "../assets.js";

class Selection {
    constructor(editor) {
        this.editor = editor;
        this.textarea = editor.elements.textarea;
        this.doc = editor.doc;

        this.ranges = new Set();
        this.highlight = window.state.highlight;
    }

    parseRange(range) {
        let r = document.createRange();
        let startNode = nodeAt(range.start);
        let endNode = nodeAt(range.end);
        console.log({ startNode, endNode });
        range.Range = r;

        if (startNode == undefined || endNode == undefined) return r;
        r.setStart(...startNode);
        r.setEnd(...endNode);

        return r;
    }

    setRanges(ranges = []) {
        this.removeRange(this.ranges);
        this.addRange(ranges);
    }

    addRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.ranges.add(range);
            this.highlight.add(this.parseRange(range));
        }
    }

    removeRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.ranges.delete(range);
            this.highlight.delete(range.Range);
        }
    }

    hideRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.highlight.delete(range.Range);
        }
    }

    revealRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.highlight.add(range.Range);
        }
    }
}

export default Selection;
