export type StepFn = (now: number) => void;

export interface LoopConfig {
  mode: "RAF" | "Interval";
  ms?: number;
}

export class RuntimeLoop {
  private steps: StepFn[] = [];
  private config: LoopConfig;
  private running: boolean = false;
  private rafId: number = 0;
  private intervalId: number = 0;

  constructor(config: LoopConfig) {
    this.config = config;
  }

  setSteps(steps: StepFn[]): void {
    this.steps = steps;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    if (this.config.mode === "RAF") {
      const tick = () => {
        if (!this.running) return;
        const now = performance.now();
        this.runSteps(now);
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    } else {
      const ms = this.config.ms ?? 100;
      this.intervalId = window.setInterval(() => {
        const now = performance.now();
        this.runSteps(now);
      }, ms);
    }
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.intervalId) clearInterval(this.intervalId);
  }

  isRunning(): boolean {
    return this.running;
  }

  private runSteps(now: number): void {
    for (const step of this.steps) {
      try {
        step(now);
      } catch (err) {
        console.error("[BrainWeb] Step error:", err);
        this.stop();
        return;
      }
    }
  }
}
