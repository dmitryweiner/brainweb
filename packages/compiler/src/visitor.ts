import { CstNode, IToken } from "chevrotain";
import { parserInstance } from "./parser";
import {
  AppNode, Declaration, SensorNode, EncoderNode, SensorPattern, FeatureOp,
  RegionNode, PopulationNode, ProjectionNode, TopologyExpr, WeightInitExpr,
  LearningRuleExpr, CircuitNode, ModulatorNode, EffectorNode, BindingNode,
  RuntimeNode, StepNode, GuardNode, TimeValue, NumberOrLen,
  PlasticityNode, Loc,
} from "./ast";

const BaseCstVisitor = parserInstance.getBaseCstVisitorConstructor();

function loc(token: IToken): Loc {
  return {
    startLine: token.startLine ?? 0,
    startColumn: token.startColumn ?? 0,
    endLine: token.endLine ?? 0,
    endColumn: token.endColumn ?? 0,
  };
}

function locFromCst(ctx: any, key: string): Loc {
  const tok = ctx[key]?.[0];
  if (tok) return loc(tok);
  return { startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 };
}

function img(token: IToken): string {
  return token.image;
}

function parseTime(token: IToken): TimeValue {
  const m = token.image.match(/^(\d+(?:\.\d+)?)(ms|s|m)$/);
  if (!m) throw new Error(`Invalid time literal: ${token.image}`);
  return { value: parseFloat(m[1]), unit: m[2] as "ms" | "s" | "m" };
}

function stripQuotes(s: string): string {
  return s.slice(1, -1).replace(/\\"/g, '"');
}

class BrainWebCstVisitor extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  program(ctx: any): AppNode {
    return this.visit(ctx.appDecl);
  }

  appDecl(ctx: any): AppNode {
    const name = img(ctx.Identifier[0]);
    const decls: Declaration[] = ctx.declaration
      ? ctx.declaration.map((d: CstNode) => this.visit(d))
      : [];
    return { kind: "App", name, declarations: decls, loc: loc(ctx.KwApp[0]) };
  }

  declaration(ctx: any): Declaration {
    if (ctx.sensorDecl) return this.visit(ctx.sensorDecl);
    if (ctx.encoderDecl) return this.visit(ctx.encoderDecl);
    if (ctx.regionDecl) return this.visit(ctx.regionDecl);
    if (ctx.circuitDecl) return this.visit(ctx.circuitDecl);
    if (ctx.modulatorDecl) return this.visit(ctx.modulatorDecl);
    if (ctx.effectorDecl) return this.visit(ctx.effectorDecl);
    if (ctx.runtimeDecl) return this.visit(ctx.runtimeDecl);
    throw new Error("Unknown declaration");
  }

  sensorDecl(ctx: any): SensorNode {
    const name = img(ctx.Identifier[0]);
    const eventTypes: string[] = this.visit(ctx.identifierList);
    return { kind: "Sensor", name, eventTypes, loc: loc(ctx.KwSensor[0]) };
  }

  encoderDecl(ctx: any): EncoderNode {
    const name = img(ctx.Identifier[0]);
    const inputs: SensorPattern[] = this.visit(ctx.sensorPatternList);
    const dim = parseInt(img(ctx.NumberLiteral[0]), 10);
    const policy: FeatureOp[] = ctx.featureOp
      ? ctx.featureOp.map((f: CstNode) => this.visit(f))
      : [];
    return { kind: "Encoder", name, inputs, outDim: dim, policy, loc: loc(ctx.KwEncoder[0]) };
  }

  sensorPatternList(ctx: any): SensorPattern[] {
    const patterns: SensorPattern[] = [this.visit(ctx.sensorPattern[0])];
    if (ctx.sensorPattern.length > 1) {
      for (let i = 1; i < ctx.sensorPattern.length; i++) {
        patterns.push(this.visit(ctx.sensorPattern[i]));
      }
    }
    return patterns;
  }

  sensorPattern(ctx: any): SensorPattern {
    const sensorToken = ctx.Identifier?.[0] ?? ctx.Star?.[0];
    const eventToken = ctx.Identifier?.[1] ?? ctx.Star?.[1] ?? ctx.Identifier?.[0];

    let sensor: string;
    let event: string;

    if (ctx.Star && ctx.Star.length >= 1 && ctx.Star[0].startOffset < (ctx.Identifier?.[0]?.startOffset ?? Infinity)) {
      sensor = "*";
      event = ctx.Identifier?.[0] ? img(ctx.Identifier[0]) : "*";
    } else if (ctx.Identifier && ctx.Identifier.length >= 2) {
      sensor = img(ctx.Identifier[0]);
      event = img(ctx.Identifier[1]);
    } else if (ctx.Identifier && ctx.Identifier.length === 1) {
      sensor = img(ctx.Identifier[0]);
      event = ctx.Star ? "*" : img(ctx.Identifier[0]);
    } else {
      sensor = "*";
      event = "*";
    }

    return { sensor, event };
  }

  featureOp(ctx: any): FeatureOp {
    if (ctx.featureOpOnehot) return this.visit(ctx.featureOpOnehot);
    if (ctx.featureOpBucket) return this.visit(ctx.featureOpBucket);
    if (ctx.featureOpHash) return this.visit(ctx.featureOpHash);
    if (ctx.featureOpNumeric) return this.visit(ctx.featureOpNumeric);
    if (ctx.featureOpClamp) return this.visit(ctx.featureOpClamp);
    if (ctx.featureOpScale) return this.visit(ctx.featureOpScale);
    throw new Error("Unknown feature op");
  }

  featureOpOnehot(ctx: any): FeatureOp {
    return { kind: "onehot", arg: img(ctx.Identifier[0]) };
  }

  featureOpBucket(ctx: any): FeatureOp {
    return { kind: "bucket", arg: img(ctx.Identifier[0]), bins: parseInt(img(ctx.NumberLiteral[0]), 10) };
  }

  featureOpHash(ctx: any): FeatureOp {
    return { kind: "hash", arg: img(ctx.Identifier[0]), buckets: parseInt(img(ctx.NumberLiteral[0]), 10) };
  }

  featureOpNumeric(ctx: any): FeatureOp {
    return { kind: "numeric", arg: img(ctx.Identifier[0]) };
  }

  featureOpClamp(ctx: any): FeatureOp {
    return {
      kind: "clamp",
      arg: img(ctx.Identifier[0]),
      min: parseFloat(img(ctx.NumberLiteral[0])),
      max: parseFloat(img(ctx.NumberLiteral[1])),
    };
  }

  featureOpScale(ctx: any): FeatureOp {
    return {
      kind: "scale",
      arg: img(ctx.Identifier[0]),
      factor: parseFloat(img(ctx.NumberLiteral[0])),
    };
  }

  regionDecl(ctx: any): RegionNode {
    const name = img(ctx.Identifier[0]);
    const populations: PopulationNode[] = ctx.populationDecl
      ? ctx.populationDecl.map((p: CstNode) => this.visit(p))
      : [];
    const projections: ProjectionNode[] = ctx.projectionDecl
      ? ctx.projectionDecl.map((p: CstNode) => this.visit(p))
      : [];
    return { kind: "Region", name, populations, projections, loc: loc(ctx.KwRegion[0]) };
  }

  populationDecl(ctx: any): PopulationNode {
    const name = img(ctx.Identifier[0]);
    const l = loc(ctx.KwPopulation[0]);
    if (ctx.statePopBody) {
      const body = this.visit(ctx.statePopBody);
      return { kind: "StatePop", name, ...body, loc: l };
    }
    if (ctx.spikingPopBody) {
      const body = this.visit(ctx.spikingPopBody);
      return { kind: "SpikingPop", name, ...body, loc: l };
    }
    if (ctx.recurrentPopBody) {
      const body = this.visit(ctx.recurrentPopBody);
      return { kind: "RecurrentPop", name, ...body, loc: l };
    }
    if (ctx.ratePopBody) {
      const body = this.visit(ctx.ratePopBody);
      return { kind: "RatePop", name, ...body, loc: l };
    }
    if (ctx.wtaPopBody) {
      const body = this.visit(ctx.wtaPopBody);
      return { kind: "WtaPop", name, ...body, loc: l };
    }
    throw new Error("Unknown population kind");
  }

  statePopBody(ctx: any): { slots: number; decay: TimeValue; merge: string } {
    return {
      slots: parseInt(img(ctx.NumberLiteral[0]), 10),
      decay: parseTime(ctx.TimeLiteral[0]),
      merge: stripQuotes(img(ctx.StringLiteral[0])),
    };
  }

  spikingPopBody(ctx: any): {
    neurons: number; tauMs: TimeValue; refrMs: TimeValue;
    targetRate: number; inhibition: string;
  } {
    return {
      neurons: parseInt(img(ctx.NumberLiteral[0]), 10),
      tauMs: parseTime(ctx.TimeLiteral[0]),
      refrMs: parseTime(ctx.TimeLiteral[1]),
      targetRate: parseFloat(img(ctx.NumberLiteral[1])),
      inhibition: stripQuotes(img(ctx.StringLiteral[0])),
    };
  }

  recurrentPopBody(ctx: any): { neurons: number; dt: TimeValue } {
    return {
      neurons: parseInt(img(ctx.NumberLiteral[0]), 10),
      dt: parseTime(ctx.TimeLiteral[0]),
    };
  }

  ratePopBody(ctx: any): { units: NumberOrLen } {
    return { units: this.visit(ctx.numberOrLen) };
  }

  wtaPopBody(ctx: any): { units: NumberOrLen } {
    return { units: this.visit(ctx.numberOrLen) };
  }

  numberOrLen(ctx: any): NumberOrLen {
    if (ctx.KwLen) {
      return { kind: "len", ref: img(ctx.Identifier[0]) };
    }
    return { kind: "literal", value: parseInt(img(ctx.NumberLiteral[0]), 10) };
  }

  projectionDecl(ctx: any): ProjectionNode {
    const names = ctx.qualifiedName.map((qn: CstNode) => this.visit(qn));
    const from = names[0];
    const to = names[1];
    const topology: TopologyExpr = this.visit(ctx.topologyExpr);
    const weightInit: WeightInitExpr | undefined = ctx.weightInitExpr
      ? this.visit(ctx.weightInitExpr)
      : undefined;
    const rule: LearningRuleExpr | undefined = ctx.learningRuleExpr
      ? this.visit(ctx.learningRuleExpr)
      : undefined;
    return {
      kind: "Projection", from, to, topology,
      weightInit, rule,
      loc: loc(ctx.KwProjection[0]),
    };
  }

  qualifiedName(ctx: any): string {
    const parts = ctx.Identifier.map((t: IToken) => img(t));
    return parts.join(".");
  }

  topologyExpr(ctx: any): TopologyExpr {
    if (ctx.KwDense) return { kind: "dense" };
    if (ctx.KwLinear) return { kind: "linear" };
    if (ctx.sparseRandomExpr) return this.visit(ctx.sparseRandomExpr);
    if (ctx.localExpr) return this.visit(ctx.localExpr);
    if (ctx.softmaxExpr) return this.visit(ctx.softmaxExpr);
    throw new Error("Unknown topology");
  }

  sparseRandomExpr(ctx: any): TopologyExpr {
    return {
      kind: "sparse_random",
      p: parseFloat(img(ctx.NumberLiteral[0])),
      seed: parseInt(img(ctx.NumberLiteral[1]), 10),
    };
  }

  localExpr(ctx: any): TopologyExpr {
    return { kind: "local", radius: parseInt(img(ctx.NumberLiteral[0]), 10) };
  }

  softmaxExpr(ctx: any): TopologyExpr {
    return { kind: "softmax", temperature: parseFloat(img(ctx.NumberLiteral[0])) };
  }

  weightInitExpr(ctx: any): WeightInitExpr {
    if (ctx.normalInitExpr) return this.visit(ctx.normalInitExpr);
    if (ctx.uniformInitExpr) return this.visit(ctx.uniformInitExpr);
    if (ctx.constantInitExpr) return this.visit(ctx.constantInitExpr);
    throw new Error("Unknown weight init");
  }

  normalInitExpr(ctx: any): WeightInitExpr {
    return { kind: "normal", mu: parseFloat(img(ctx.NumberLiteral[0])), sigma: parseFloat(img(ctx.NumberLiteral[1])) };
  }

  uniformInitExpr(ctx: any): WeightInitExpr {
    return { kind: "uniform", a: parseFloat(img(ctx.NumberLiteral[0])), b: parseFloat(img(ctx.NumberLiteral[1])) };
  }

  constantInitExpr(ctx: any): WeightInitExpr {
    return { kind: "constant", c: parseFloat(img(ctx.NumberLiteral[0])) };
  }

  learningRuleExpr(ctx: any): LearningRuleExpr {
    if (ctx.KwNone) return { kind: "none" };
    return { kind: "hebbian", trace: parseTime(ctx.TimeLiteral[0]) };
  }

  circuitDecl(ctx: any): CircuitNode {
    const name = img(ctx.Identifier[0]);
    const actions: string[] = this.visit(ctx.identifierList);
    const populations: PopulationNode[] = ctx.populationDecl
      ? ctx.populationDecl.map((p: CstNode) => this.visit(p))
      : [];
    const projections: ProjectionNode[] = ctx.projectionDecl
      ? ctx.projectionDecl.map((p: CstNode) => this.visit(p))
      : [];
    const modulators: ModulatorNode[] = ctx.modulatorDecl
      ? ctx.modulatorDecl.map((m: CstNode) => this.visit(m))
      : [];
    const plasticity: PlasticityNode[] = ctx.plasticityDecl
      ? ctx.plasticityDecl.map((p: CstNode) => this.visit(p))
      : [];
    return {
      kind: "Circuit", name, actions, populations, projections,
      modulators, plasticity, loc: loc(ctx.KwCircuit[0]),
    };
  }

  plasticityDecl(ctx: any): PlasticityNode {
    const target = img(ctx.Identifier[0]);
    const rule = img(ctx.Identifier[1]);
    return { kind: "Plasticity", target, rule, loc: loc(ctx.KwPlasticity[0]) };
  }

  modulatorDecl(ctx: any): ModulatorNode {
    const name = img(ctx.Identifier[0]);
    return { kind: "Modulator", name, source: "reward", loc: loc(ctx.KwModulator[0]) };
  }

  effectorDecl(ctx: any): EffectorNode {
    const name = img(ctx.Identifier[0]);
    const bindings: BindingNode[] = ctx.bindingDecl
      ? ctx.bindingDecl.map((b: CstNode) => this.visit(b))
      : [];
    return { kind: "Effector", name, bindings, loc: loc(ctx.KwEffector[0]) };
  }

  bindingDecl(ctx: any): BindingNode {
    const action = img(ctx.Identifier[0]);
    if (ctx.KwNoop) {
      return { action, target: { kind: "noop" }, loc: loc(ctx.KwBind[0]) };
    }
    const expr = stripQuotes(img(ctx.StringLiteral[0]));
    return { action, target: { kind: "js", expr }, loc: loc(ctx.KwBind[0]) };
  }

  runtimeDecl(ctx: any): RuntimeNode {
    let tick: string | TimeValue;
    if (ctx.KwRAF) {
      tick = "RAF";
    } else if (ctx.TimeLiteral) {
      tick = parseTime(ctx.TimeLiteral[0]);
    } else if (ctx.Identifier) {
      tick = img(ctx.Identifier[0]);
    } else {
      tick = "RAF";
    }

    const steps: StepNode[] = ctx.stepCommand
      ? ctx.stepCommand.map((s: CstNode) => this.visit(s))
      : [];
    const guards: GuardNode[] = ctx.guardDecl
      ? ctx.guardDecl.map((g: CstNode) => this.visit(g))
      : [];
    return { kind: "Runtime", tick, steps, guards, loc: loc(ctx.KwRuntime[0]) };
  }

  stepCommand(ctx: any): StepNode {
    if (ctx.ingestStep) return this.visit(ctx.ingestStep);
    if (ctx.runStep) return this.visit(ctx.runStep);
    if (ctx.emitStep) return this.visit(ctx.emitStep);
    throw new Error("Unknown step command");
  }

  ingestStep(ctx: any): StepNode {
    const sensors: string[] = this.visit(ctx.identifierList);
    return { kind: "ingest", sensors };
  }

  runStep(ctx: any): StepNode {
    const module: string = this.visit(ctx.qualifiedName);
    const dt: TimeValue | undefined = ctx.TimeLiteral
      ? parseTime(ctx.TimeLiteral[0])
      : undefined;
    const when: string | undefined = ctx.Identifier?.[0]
      ? img(ctx.Identifier[0])
      : undefined;
    return { kind: "run", module, dt, when };
  }

  emitStep(ctx: any): StepNode {
    const effector = img(ctx.Identifier[0]);
    const from: string = this.visit(ctx.qualifiedName);
    const winnerOnly = !!ctx.KwWinnerOnly;
    return { kind: "emit", effector, from, winnerOnly };
  }

  guardDecl(ctx: any): GuardNode {
    if (ctx.KwMaxEffectsPerSec) {
      return { kind: "max_effects_per_sec", limit: parseInt(img(ctx.NumberLiteral[0]), 10) };
    }
    if (ctx.KwSuppressRepeats) {
      return { kind: "suppress_repeats", window: parseTime(ctx.TimeLiteral[0]) };
    }
    if (ctx.KwKeepTargetRate) {
      return {
        kind: "keep_target_rate",
        population: img(ctx.Identifier[0]),
        hz: parseFloat(img(ctx.NumberLiteral[0])),
      };
    }
    throw new Error("Unknown guard");
  }

  identifierList(ctx: any): string[] {
    return ctx.Identifier.map((t: IToken) => img(t));
  }
}

export const visitorInstance = new BrainWebCstVisitor();
