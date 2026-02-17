import { BwEvent } from "./types";
export declare class EventQueue {
    private buf;
    push(event: BwEvent): void;
    drain(): BwEvent[];
    get length(): number;
}
//# sourceMappingURL=eventQueue.d.ts.map