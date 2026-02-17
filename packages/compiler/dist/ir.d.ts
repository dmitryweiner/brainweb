export interface AppIR {
    name: string;
    sensors: SensorIR[];
    encoders: EncoderIR[];
    modules: ModuleIR[];
    projections: ProjectionIR[];
    effectors: EffectorIR[];
    runtime: RuntimeIR;
}
export interface SensorIR {
    name: string;
    eventTypes: string[];
}
export interface EncoderIR {
    name: string;
    inputs: SensorPatternIR[];
    dim: number;
    featureOps: FeatureOpIR[];
}
export interface SensorPatternIR {
    sensor: string;
    event: string;
}
export type FeatureOpIR = {
    kind: "onehot";
    field: string;
} | {
    kind: "bucket";
    field: string;
    bins: number;
} | {
    kind: "hash";
    field: string;
    buckets: number;
} | {
    kind: "numeric";
    field: string;
} | {
    kind: "clamp";
    field: string;
    min: number;
    max: number;
} | {
    kind: "scale";
    field: string;
    factor: number;
};
export type ModuleIR = StateModuleIR | SpikingModuleIR | RecurrentModuleIR | ActionSelectorModuleIR | RateModuleIR;
export interface StateModuleIR {
    kind: "State";
    name: string;
    slots: number;
    decayMs: number;
    merge: string;
}
export interface SpikingModuleIR {
    kind: "Spiking";
    name: string;
    neurons: number;
    tauMs: number;
    refrMs: number;
    targetRate: number;
    inhibition: string;
}
export interface RecurrentModuleIR {
    kind: "Recurrent";
    name: string;
    neurons: number;
    dtMs: number;
}
export interface ActionSelectorModuleIR {
    kind: "ActionSelector";
    name: string;
    actions: string[];
    temperature: number;
}
export interface RateModuleIR {
    kind: "Rate";
    name: string;
    units: number;
}
export interface ProjectionIR {
    from: string;
    to: string;
    topology: TopologyIR;
    init: InitIR;
    learning?: LearningIR;
}
export type TopologyIR = {
    kind: "dense";
} | {
    kind: "sparse_random";
    p: number;
    seed: number;
} | {
    kind: "local";
    radius: number;
} | {
    kind: "linear";
} | {
    kind: "softmax";
    temperature: number;
};
export type InitIR = {
    kind: "normal";
    mu: number;
    sigma: number;
} | {
    kind: "uniform";
    a: number;
    b: number;
} | {
    kind: "constant";
    c: number;
} | {
    kind: "default";
};
export type LearningIR = {
    kind: "hebbian";
    traceMs: number;
} | {
    kind: "none";
};
export interface EffectorIR {
    name: string;
    bindings: EffectorBindingIR[];
}
export interface EffectorBindingIR {
    action: string;
    kind: "js" | "noop";
    expr?: string;
}
export interface RuntimeIR {
    tick: TickIR;
    steps: StepIR[];
    guards: GuardIR[];
}
export type TickIR = {
    mode: "RAF";
} | {
    mode: "Interval";
    ms: number;
};
export type StepIR = {
    kind: "ingest";
    sensors: string[];
} | {
    kind: "run";
    module: string;
    dtMs?: number;
    when?: string;
} | {
    kind: "emit";
    effector: string;
    from: string;
    winnerOnly: boolean;
};
export type GuardIR = {
    kind: "max_effects_per_sec";
    limit: number;
} | {
    kind: "suppress_repeats";
    windowMs: number;
} | {
    kind: "keep_target_rate";
    population: string;
    hz: number;
};
//# sourceMappingURL=ir.d.ts.map