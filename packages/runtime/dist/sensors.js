"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wireSensors = wireSensors;
function cssPath(el) {
    if (!el || el === document.body)
        return "body";
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body) {
        let selector = cur.tagName.toLowerCase();
        if (cur.id) {
            selector += `#${cur.id}`;
            parts.unshift(selector);
            break;
        }
        if (cur.className && typeof cur.className === "string") {
            selector += "." + cur.className.trim().split(/\s+/).join(".");
        }
        parts.unshift(selector);
        cur = cur.parentElement;
    }
    return parts.join(" > ");
}
function normalizePayload(ev) {
    const p = {};
    if (ev instanceof MouseEvent) {
        p.clientX = ev.clientX;
        p.clientY = ev.clientY;
        p.button = ev.button;
        p.target = cssPath(ev.target);
    }
    else if (ev instanceof KeyboardEvent) {
        p.key = ev.key;
        p.code = ev.code;
        p.target = cssPath(ev.target);
    }
    else if (ev instanceof InputEvent || (ev.target && "value" in ev.target)) {
        const tgt = ev.target;
        p.inputLen = tgt.value?.length ?? 0;
        p.target = cssPath(ev.target);
    }
    if (ev.type === "scroll") {
        p.scrollY = window.scrollY;
        p.scrollX = window.scrollX;
    }
    return p;
}
const DOM_EVENT_MAP = {
    Click: "click",
    Input: "input",
    KeyDown: "keydown",
    KeyUp: "keyup",
    Scroll: "scroll",
    Focus: "focus",
    Blur: "blur",
    MouseMove: "mousemove",
    VisibilityChange: "visibilitychange",
};
function wireSensors(configs, queue) {
    const cleanups = [];
    for (const cfg of configs) {
        for (const evType of cfg.eventTypes) {
            const domEvent = DOM_EVENT_MAP[evType];
            if (!domEvent)
                continue;
            const target = (domEvent === "scroll" || domEvent === "visibilitychange")
                ? document
                : document;
            const handler = (ev) => {
                queue.push({
                    sensor: cfg.name,
                    type: evType,
                    t: performance.now(),
                    payload: normalizePayload(ev),
                });
            };
            target.addEventListener(domEvent, handler, { passive: true });
            cleanups.push(() => target.removeEventListener(domEvent, handler));
        }
    }
    return () => cleanups.forEach(fn => fn());
}
//# sourceMappingURL=sensors.js.map