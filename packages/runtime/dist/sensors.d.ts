import { EventQueue } from "./eventQueue";
export interface SensorConfig {
    name: string;
    eventTypes: string[];
}
export declare function wireSensors(configs: SensorConfig[], queue: EventQueue): () => void;
//# sourceMappingURL=sensors.d.ts.map