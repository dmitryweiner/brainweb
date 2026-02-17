import { BwEvent } from "./types";
export interface FeatureOpConfig {
    kind: string;
    field: string;
    buckets?: number;
    bins?: number;
    min?: number;
    max?: number;
    factor?: number;
}
export interface EncoderConfig {
    dim: number;
    featureOps: FeatureOpConfig[];
    eventTypeList: string[];
}
export declare class Encoder {
    private dim;
    private ops;
    private output;
    private eventTypeList;
    private lastEventTime;
    constructor(config: EncoderConfig);
    encode(events: BwEvent[], now: number): Float32Array;
    getDim(): number;
}
//# sourceMappingURL=encoder.d.ts.map