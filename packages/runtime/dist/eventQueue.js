"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventQueue = void 0;
class EventQueue {
    constructor() {
        this.buf = [];
    }
    push(event) {
        this.buf.push(event);
    }
    drain() {
        if (this.buf.length === 0)
            return [];
        const events = this.buf;
        this.buf = [];
        return events;
    }
    get length() {
        return this.buf.length;
    }
}
exports.EventQueue = EventQueue;
//# sourceMappingURL=eventQueue.js.map