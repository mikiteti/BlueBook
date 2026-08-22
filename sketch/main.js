class Stroke {
    constructor({ tool, weight = 1, stroke = "black", fill = "none", opacity = "100%", transform = "none", options = {} } = {}) {
        this.tool = tool;
        this.weight = weight;
        this.stroke = stroke;
        this.fill = fill;
        this.opacity = opacity;
        this.transform = transform;
        this.options = options;
    }
}

class SketchEditor {
    constructor(container = document.body) {
        this.element = document.createElement("div");
        this.element.classList.add("sketchEditor");
        container.appendChild(this.element);

        this.menubar = document.createElement("div");
        this.menubar.classList.add("menubar");
        this.element.appendChild(this.menubar);

        this.tools = {
            select: {},
            rect: {},
            ellipse: {},
            line: {}, // also polyline, curve, and arrow
            pen: {},
        }

        for (let i in this.tools) {
            let e = document.createElement("div");
            this.sketchingTools[i].element = e;
            e.classList.add("tool");
            e.innerHTML = i;
            this.menubar.appendChild(e);
        }
    }

    setState() {

    }

    getState() {

    }

    getPreview() {

    }

    destroy() {

    }
}

window.sketchEditor = new SketchEditor();

export default SketchEditor;
