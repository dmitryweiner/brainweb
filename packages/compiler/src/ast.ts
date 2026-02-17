// ── BrainWeb AST (close to surface syntax) ──

export interface Loc {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

// ── Top-level ──

export interface AppNode {
  kind: "App";
  name: string;
  declarations: Declaration[];
  loc: Loc;
}

export type Declaration =
  | SensorNode
  | EncoderNode
  | RegionNode
  | CircuitNode
  | ModulatorNode
  | EffectorNode
  | RuntimeNode;

// ── Sensor ──

export interface SensorNode {
  kind: "Sensor";
  name: string;
  eventTypes: string[];
  loc: Loc;
}

// ── Encoder ──

export interface EncoderNode {
  kind: "Encoder";
  name: string;
  inputs: SensorPattern[];
  outDim: number;
  policy: FeatureOp[];
  loc: Loc;
}

export interface SensorPattern {
  sensor: string;
  event: string; // "*" for wildcard
}

export type FeatureOp =
  | { kind: "onehot"; arg: string }
  | { kind: "bucket"; arg: string; bins: number }
  | { kind: "hash"; arg: string; buckets: number }
  | { kind: "numeric"; arg: string }
  | { kind: "clamp"; arg: string; min: number; max: number }
  | { kind: "scale"; arg: string; factor: number };

// ── Region ──

export interface RegionNode {
  kind: "Region";
  name: string;
  populations: PopulationNode[];
  projections: ProjectionNode[];
  loc: Loc;
}

// ── Population ──

export type PopulationNode =
  | StatePopNode
  | SpikingPopNode
  | RecurrentPopNode
  | RatePopNode
  | WtaPopNode;

export interface StatePopNode {
  kind: "StatePop";
  name: string;
  slots: number;
  decay: TimeValue;
  merge: string;
  loc: Loc;
}

export interface SpikingPopNode {
  kind: "SpikingPop";
  name: string;
  neurons: number;
  tauMs: TimeValue;
  refrMs: TimeValue;
  targetRate: number;
  inhibition: string;
  loc: Loc;
}

export interface RecurrentPopNode {
  kind: "RecurrentPop";
  name: string;
  neurons: number;
  dt: TimeValue;
  loc: Loc;
}

export interface RatePopNode {
  kind: "RatePop";
  name: string;
  units: NumberOrLen;
  loc: Loc;
}

export interface WtaPopNode {
  kind: "WtaPop";
  name: string;
  units: NumberOrLen;
  loc: Loc;
}

export type NumberOrLen = { kind: "literal"; value: number } | { kind: "len"; ref: string };

// ── Time values ──

export interface TimeValue {
  value: number;
  unit: "ms" | "s" | "m";
}

export function timeToMs(tv: TimeValue): number {
  switch (tv.unit) {
    case "ms": return tv.value;
    case "s": return tv.value * 1000;
    case "m": return tv.value * 60_000;
  }
}

// ── Projection ──

export interface ProjectionNode {
  kind: "Projection";
  from: string;
  to: string;
  topology: TopologyExpr;
  weightInit?: WeightInitExpr;
  rule?: LearningRuleExpr;
  loc: Loc;
}

export type TopologyExpr =
  | { kind: "dense" }
  | { kind: "sparse_random"; p: number; seed: number }
  | { kind: "local"; radius: number }
  | { kind: "linear" }
  | { kind: "softmax"; temperature: number };

export type WeightInitExpr =
  | { kind: "normal"; mu: number; sigma: number }
  | { kind: "uniform"; a: number; b: number }
  | { kind: "constant"; c: number };

export type LearningRuleExpr =
  | { kind: "hebbian"; trace: TimeValue }
  | { kind: "none" };

// ── Circuit ──

export interface CircuitNode {
  kind: "Circuit";
  name: string;
  actions: string[];
  populations: PopulationNode[];
  projections: ProjectionNode[];
  modulators: ModulatorNode[];
  plasticity: PlasticityNode[];
  loc: Loc;
}

export interface PlasticityNode {
  kind: "Plasticity";
  target: string;
  rule: string;
  loc: Loc;
}

// ── Modulator ──

export interface ModulatorNode {
  kind: "Modulator";
  name: string;
  source: string;
  loc: Loc;
}

// ── Effector ──

export interface EffectorNode {
  kind: "Effector";
  name: string;
  bindings: BindingNode[];
  loc: Loc;
}

export interface BindingNode {
  action: string;
  target: { kind: "js"; expr: string } | { kind: "noop" };
  loc: Loc;
}

// ── Runtime ──

export interface RuntimeNode {
  kind: "Runtime";
  tick: string | TimeValue;
  steps: StepNode[];
  guards: GuardNode[];
  loc: Loc;
}

export type StepNode =
  | { kind: "ingest"; sensors: string[] }
  | { kind: "run"; module: string; dt?: TimeValue; when?: string }
  | { kind: "emit"; effector: string; from: string; winnerOnly: boolean };

export type GuardNode =
  | { kind: "max_effects_per_sec"; limit: number }
  | { kind: "suppress_repeats"; window: TimeValue }
  | { kind: "keep_target_rate"; population: string; hz: number };
