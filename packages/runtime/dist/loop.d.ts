export type StepFn = (now: number) => void;
export interface LoopConfig {
    mode: "RAF" | "Interval";
    ms?: number;
}
export declare class RuntimeLoop {
    private steps;
    private config;
    private running;
    private rafId;
    private intervalId;
    constructor(config: LoopConfig);
    setSteps(steps: StepFn[]): void;
    start(): void;
    stop(): void;
    isRunning(): boolean;
    private runSteps;
}
//# sourceMappingURL=loop.d.ts.map