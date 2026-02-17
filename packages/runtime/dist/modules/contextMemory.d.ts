export interface ContextMemoryConfig {
    slots: number;
    decayMs: number;
    featureDim: number;
    merge: string;
}
export interface ContextState {
    target: string;
    eventType: string;
    features: Float32Array;
    [key: string]: any;
}
export declare class ContextMemory {
    private slots;
    private decayMs;
    private featureDim;
    private slotData;
    private slotTimes;
    private slotMeta;
    private writeIdx;
    constructor(config: ContextMemoryConfig);
    step(features: Float32Array, meta: Record<string, any>, now: number): ContextState;
    getSlotData(): Float32Array[];
}
//# sourceMappingURL=contextMemory.d.ts.map