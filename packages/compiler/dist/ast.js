"use strict";
// ── BrainWeb AST (close to surface syntax) ──
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeToMs = timeToMs;
function timeToMs(tv) {
    switch (tv.unit) {
        case "ms": return tv.value;
        case "s": return tv.value * 1000;
        case "m": return tv.value * 60000;
    }
}
//# sourceMappingURL=ast.js.map