"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeLoop = void 0;
class RuntimeLoop {
    constructor(config) {
        this.steps = [];
        this.running = false;
        this.rafId = 0;
        this.intervalId = 0;
        this.config = config;
    }
    setSteps(steps) {
        this.steps = steps;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        if (this.config.mode === "RAF") {
            const tick = () => {
                if (!this.running)
                    return;
                const now = performance.now();
                this.runSteps(now);
                this.rafId = requestAnimationFrame(tick);
            };
            this.rafId = requestAnimationFrame(tick);
        }
        else {
            const ms = this.config.ms ?? 100;
            this.intervalId = window.setInterval(() => {
                const now = performance.now();
                this.runSteps(now);
            }, ms);
        }
    }
    stop() {
        this.running = false;
        if (this.rafId)
            cancelAnimationFrame(this.rafId);
        if (this.intervalId)
            clearInterval(this.intervalId);
    }
    isRunning() {
        return this.running;
    }
    runSteps(now) {
        for (const step of this.steps) {
            try {
                step(now);
            }
            catch (err) {
                console.error("[BrainWeb] Step error:", err);
                this.stop();
                return;
            }
        }
    }
}
exports.RuntimeLoop = RuntimeLoop;
//# sourceMappingURL=loop.js.map