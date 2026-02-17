import { AppNode, SensorNode, EncoderNode, CircuitNode, EffectorNode, PopulationNode } from "./ast";
export interface Diagnostic {
    level: "error" | "warning";
    message: string;
    line?: number;
    column?: number;
}
export interface SymbolTable {
    sensors: Map<string, SensorNode>;
    encoders: Map<string, EncoderNode>;
    populations: Map<string, PopulationNode>;
    circuits: Map<string, CircuitNode>;
    effectors: Map<string, EffectorNode>;
    allModules: Set<string>;
}
export declare function validate(app: AppNode): Diagnostic[];
//# sourceMappingURL=validate.d.ts.map