import { BwEvent, RecordEntry } from "./types";
export interface DebugState {
    lastEvents: BwEvent[];
    contextTarget: string;
    contextEventType: string;
    actionValues: number[];
    actionProbs: number[];
    actionNames: string[];
    winner: string;
    guardRejection: string | null;
}
export declare class DebugOverlay {
    private container;
    private enabled;
    private state;
    constructor(enabled: boolean);
    private createOverlay;
    update(state: Partial<DebugState>): void;
    private render;
    destroy(): void;
}
export declare class Recorder {
    private entries;
    private recording;
    start(): void;
    stop(): RecordEntry[];
    isRecording(): boolean;
    recordEvent(event: BwEvent): void;
    recordAction(t: number, winner: string, guardRejected: boolean): void;
    getEntries(): RecordEntry[];
}
//# sourceMappingURL=debug.d.ts.map