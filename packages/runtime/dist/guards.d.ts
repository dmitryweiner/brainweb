export interface GuardConfig {
    kind: string;
    limit?: number;
    windowMs?: number;
}
export declare class GuardChain {
    private configs;
    private recentEffects;
    lastRejection: string | null;
    constructor(configs: GuardConfig[]);
    check(action: string, now: number): boolean;
    record(action: string, now: number): void;
}
//# sourceMappingURL=guards.d.ts.map