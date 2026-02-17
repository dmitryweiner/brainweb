import {
  AppNode, Declaration, SensorNode, EncoderNode, RegionNode,
  CircuitNode, EffectorNode, RuntimeNode, PopulationNode,
  ProjectionNode, TimeValue, timeToMs, NumberOrLen,
} from "./ast.js";
import {
  AppIR, SensorIR, EncoderIR, SensorPatternIR, FeatureOpIR,
  ModuleIR, ProjectionIR, TopologyIR, InitIR, LearningIR,
  EffectorIR, EffectorBindingIR, RuntimeIR, TickIR, StepIR, GuardIR,
} from "./ir.js";

export function lower(app: AppNode): AppIR {
  const sensors: SensorIR[] = [];
  const encoders: EncoderIR[] = [];
  const modules: ModuleIR[] = [];
  const projections: ProjectionIR[] = [];
  const effectors: EffectorIR[] = [];
  let runtime: RuntimeIR | undefined;

  for (const decl of app.declarations) {
    switch (decl.kind) {
      case "Sensor":
        sensors.push(lowerSensor(decl));
        break;
      case "Encoder":
        encoders.push(lowerEncoder(decl));
        break;
      case "Region":
        lowerRegion(decl, modules, projections);
        break;
      case "Circuit":
        lowerCircuit(decl, modules, projections);
        break;
      case "Effector":
        effectors.push(lowerEffector(decl));
        break;
      case "Runtime":
        runtime = lowerRuntime(decl);
        break;
      default:
        break;
    }
  }

  if (!runtime) {
    runtime = { tick: { mode: "RAF" }, steps: [], guards: [] };
  }

  return { name: app.name, sensors, encoders, modules, projections, effectors, runtime };
}

function lowerSensor(s: SensorNode): SensorIR {
  return { name: s.name, eventTypes: s.eventTypes };
}

function lowerEncoder(e: EncoderNode): EncoderIR {
  return {
    name: e.name,
    inputs: e.inputs.map(i => ({ sensor: i.sensor, event: i.event })),
    dim: e.outDim,
    featureOps: e.policy.map(lowerFeatureOp),
  };
}

function lowerFeatureOp(op: import("./ast.js").FeatureOp): FeatureOpIR {
  switch (op.kind) {
    case "onehot": return { kind: "onehot", field: op.arg };
    case "bucket": return { kind: "bucket", field: op.arg, bins: op.bins };
    case "hash": return { kind: "hash", field: op.arg, buckets: op.buckets };
    case "numeric": return { kind: "numeric", field: op.arg };
    case "clamp": return { kind: "clamp", field: op.arg, min: op.min, max: op.max };
    case "scale": return { kind: "scale", field: op.arg, factor: op.factor };
  }
}

function lowerRegion(
  region: RegionNode,
  modules: ModuleIR[],
  projections: ProjectionIR[],
): void {
  for (const pop of region.populations) {
    modules.push(lowerPopulation(pop, region.name));
  }
  for (const proj of region.projections) {
    projections.push(lowerProjection(proj, region.name));
  }
}

function lowerCircuit(
  circuit: CircuitNode,
  modules: ModuleIR[],
  projections: ProjectionIR[],
): void {
  // Collect all actions and temperature from populations/projections
  let temperature = 1.0;

  for (const pop of circuit.populations) {
    if (pop.kind === "WtaPop") {
      // This becomes the ActionSelector's gate
      modules.push(lowerPopulation(pop, circuit.name));
    } else if (pop.kind === "RatePop") {
      modules.push(lowerPopulation(pop, circuit.name));
    } else {
      modules.push(lowerPopulation(pop, circuit.name));
    }
  }

  for (const proj of circuit.projections) {
    if (proj.topology.kind === "softmax") {
      temperature = proj.topology.temperature;
    }
    projections.push(lowerProjection(proj, circuit.name));
  }

  // Create the top-level ActionSelector module for this circuit
  const actionSelector: ModuleIR = {
    kind: "ActionSelector",
    name: circuit.name,
    actions: circuit.actions,
    temperature,
  };
  modules.push(actionSelector);
}

function lowerPopulation(pop: PopulationNode, prefix: string): ModuleIR {
  const name = `${prefix}__${pop.name}`;
  switch (pop.kind) {
    case "StatePop":
      return {
        kind: "State",
        name,
        slots: pop.slots,
        decayMs: timeToMs(pop.decay),
        merge: pop.merge,
      };
    case "SpikingPop":
      return {
        kind: "Spiking",
        name,
        neurons: pop.neurons,
        tauMs: timeToMs(pop.tauMs),
        refrMs: timeToMs(pop.refrMs),
        targetRate: pop.targetRate,
        inhibition: pop.inhibition,
      };
    case "RecurrentPop":
      return {
        kind: "Recurrent",
        name,
        neurons: pop.neurons,
        dtMs: timeToMs(pop.dt),
      };
    case "RatePop":
      return {
        kind: "Rate",
        name,
        units: resolveNumberOrLen(pop.units),
      };
    case "WtaPop":
      return {
        kind: "Rate",
        name,
        units: resolveNumberOrLen(pop.units),
      };
  }
}

function resolveNumberOrLen(nol: NumberOrLen): number {
  if (nol.kind === "literal") return nol.value;
  // len(actions) is resolved at circuit level; use placeholder
  return -1;
}

function lowerProjection(proj: ProjectionNode, prefix: string): ProjectionIR {
  // Qualify names within the current scope if they don't contain a dot
  const from = qualifyName(proj.from, prefix);
  const to = qualifyName(proj.to, prefix);

  return {
    from,
    to,
    topology: lowerTopology(proj.topology),
    init: proj.weightInit ? lowerInit(proj.weightInit) : { kind: "default" },
    learning: proj.rule ? lowerLearning(proj.rule) : undefined,
  };
}

function qualifyName(name: string, prefix: string): string {
  // If the name already contains a dot or double underscore, it's already qualified
  if (name.includes(".") || name.includes("__")) {
    return name.replace(/\./g, "__");
  }
  return `${prefix}__${name}`;
}

function lowerTopology(t: import("./ast.js").TopologyExpr): TopologyIR {
  switch (t.kind) {
    case "dense": return { kind: "dense" };
    case "sparse_random": return { kind: "sparse_random", p: t.p, seed: t.seed };
    case "local": return { kind: "local", radius: t.radius };
    case "linear": return { kind: "linear" };
    case "softmax": return { kind: "softmax", temperature: t.temperature };
  }
}

function lowerInit(i: import("./ast.js").WeightInitExpr): InitIR {
  switch (i.kind) {
    case "normal": return { kind: "normal", mu: i.mu, sigma: i.sigma };
    case "uniform": return { kind: "uniform", a: i.a, b: i.b };
    case "constant": return { kind: "constant", c: i.c };
  }
}

function lowerLearning(r: import("./ast.js").LearningRuleExpr): LearningIR {
  switch (r.kind) {
    case "hebbian": return { kind: "hebbian", traceMs: timeToMs(r.trace) };
    case "none": return { kind: "none" };
  }
}

function lowerEffector(e: EffectorNode): EffectorIR {
  return {
    name: e.name,
    bindings: e.bindings.map(b => ({
      action: b.action,
      kind: b.target.kind as "js" | "noop",
      expr: b.target.kind === "js" ? b.target.expr : undefined,
    })),
  };
}

function lowerRuntime(r: RuntimeNode): RuntimeIR {
  let tick: TickIR;
  if (r.tick === "RAF") {
    tick = { mode: "RAF" };
  } else if (typeof r.tick === "string") {
    // Named tick like "Tick100ms" -- map to interval
    if (r.tick.includes("100")) tick = { mode: "Interval", ms: 100 };
    else if (r.tick.includes("1s")) tick = { mode: "Interval", ms: 1000 };
    else tick = { mode: "RAF" };
  } else {
    tick = { mode: "Interval", ms: timeToMs(r.tick) };
  }

  const steps: StepIR[] = r.steps.map(s => {
    switch (s.kind) {
      case "ingest":
        return { kind: "ingest" as const, sensors: s.sensors };
      case "run":
        return {
          kind: "run" as const,
          module: s.module,
          dtMs: s.dt ? timeToMs(s.dt) : undefined,
          when: s.when,
        };
      case "emit":
        return {
          kind: "emit" as const,
          effector: s.effector,
          from: s.from,
          winnerOnly: s.winnerOnly,
        };
    }
  });

  const guards: GuardIR[] = r.guards.map(g => {
    switch (g.kind) {
      case "max_effects_per_sec":
        return { kind: "max_effects_per_sec" as const, limit: g.limit };
      case "suppress_repeats":
        return { kind: "suppress_repeats" as const, windowMs: timeToMs(g.window) };
      case "keep_target_rate":
        return { kind: "keep_target_rate" as const, population: g.population, hz: g.hz };
    }
  });

  return { tick, steps, guards };
}
