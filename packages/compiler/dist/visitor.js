"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorInstance = void 0;
const parser_1 = require("./parser");
const BaseCstVisitor = parser_1.parserInstance.getBaseCstVisitorConstructor();
function loc(token) {
    return {
        startLine: token.startLine ?? 0,
        startColumn: token.startColumn ?? 0,
        endLine: token.endLine ?? 0,
        endColumn: token.endColumn ?? 0,
    };
}
function locFromCst(ctx, key) {
    const tok = ctx[key]?.[0];
    if (tok)
        return loc(tok);
    return { startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 };
}
function img(token) {
    return token.image;
}
function parseTime(token) {
    const m = token.image.match(/^(\d+(?:\.\d+)?)(ms|s|m)$/);
    if (!m)
        throw new Error(`Invalid time literal: ${token.image}`);
    return { value: parseFloat(m[1]), unit: m[2] };
}
function stripQuotes(s) {
    return s.slice(1, -1).replace(/\\"/g, '"');
}
class BrainWebCstVisitor extends BaseCstVisitor {
    constructor() {
        super();
        this.validateVisitor();
    }
    program(ctx) {
        return this.visit(ctx.appDecl);
    }
    appDecl(ctx) {
        const name = img(ctx.Identifier[0]);
        const decls = ctx.declaration
            ? ctx.declaration.map((d) => this.visit(d))
            : [];
        return { kind: "App", name, declarations: decls, loc: loc(ctx.KwApp[0]) };
    }
    declaration(ctx) {
        if (ctx.sensorDecl)
            return this.visit(ctx.sensorDecl);
        if (ctx.encoderDecl)
            return this.visit(ctx.encoderDecl);
        if (ctx.regionDecl)
            return this.visit(ctx.regionDecl);
        if (ctx.circuitDecl)
            return this.visit(ctx.circuitDecl);
        if (ctx.modulatorDecl)
            return this.visit(ctx.modulatorDecl);
        if (ctx.effectorDecl)
            return this.visit(ctx.effectorDecl);
        if (ctx.runtimeDecl)
            return this.visit(ctx.runtimeDecl);
        throw new Error("Unknown declaration");
    }
    sensorDecl(ctx) {
        const name = img(ctx.Identifier[0]);
        const eventTypes = this.visit(ctx.identifierList);
        return { kind: "Sensor", name, eventTypes, loc: loc(ctx.KwSensor[0]) };
    }
    encoderDecl(ctx) {
        const name = img(ctx.Identifier[0]);
        const inputs = this.visit(ctx.sensorPatternList);
        const dim = parseInt(img(ctx.NumberLiteral[0]), 10);
        const policy = ctx.featureOp
            ? ctx.featureOp.map((f) => this.visit(f))
            : [];
        return { kind: "Encoder", name, inputs, outDim: dim, policy, loc: loc(ctx.KwEncoder[0]) };
    }
    sensorPatternList(ctx) {
        const patterns = [this.visit(ctx.sensorPattern[0])];
        if (ctx.sensorPattern.length > 1) {
            for (let i = 1; i < ctx.sensorPattern.length; i++) {
                patterns.push(this.visit(ctx.sensorPattern[i]));
            }
        }
        return patterns;
    }
    sensorPattern(ctx) {
        const sensorToken = ctx.Identifier?.[0] ?? ctx.Star?.[0];
        const eventToken = ctx.Identifier?.[1] ?? ctx.Star?.[1] ?? ctx.Identifier?.[0];
        let sensor;
        let event;
        if (ctx.Star && ctx.Star.length >= 1 && ctx.Star[0].startOffset < (ctx.Identifier?.[0]?.startOffset ?? Infinity)) {
            sensor = "*";
            event = ctx.Identifier?.[0] ? img(ctx.Identifier[0]) : "*";
        }
        else if (ctx.Identifier && ctx.Identifier.length >= 2) {
            sensor = img(ctx.Identifier[0]);
            event = img(ctx.Identifier[1]);
        }
        else if (ctx.Identifier && ctx.Identifier.length === 1) {
            sensor = img(ctx.Identifier[0]);
            event = ctx.Star ? "*" : img(ctx.Identifier[0]);
        }
        else {
            sensor = "*";
            event = "*";
        }
        return { sensor, event };
    }
    featureOp(ctx) {
        if (ctx.featureOpOnehot)
            return this.visit(ctx.featureOpOnehot);
        if (ctx.featureOpBucket)
            return this.visit(ctx.featureOpBucket);
        if (ctx.featureOpHash)
            return this.visit(ctx.featureOpHash);
        if (ctx.featureOpNumeric)
            return this.visit(ctx.featureOpNumeric);
        if (ctx.featureOpClamp)
            return this.visit(ctx.featureOpClamp);
        if (ctx.featureOpScale)
            return this.visit(ctx.featureOpScale);
        throw new Error("Unknown feature op");
    }
    featureOpOnehot(ctx) {
        return { kind: "onehot", arg: img(ctx.Identifier[0]) };
    }
    featureOpBucket(ctx) {
        return { kind: "bucket", arg: img(ctx.Identifier[0]), bins: parseInt(img(ctx.NumberLiteral[0]), 10) };
    }
    featureOpHash(ctx) {
        return { kind: "hash", arg: img(ctx.Identifier[0]), buckets: parseInt(img(ctx.NumberLiteral[0]), 10) };
    }
    featureOpNumeric(ctx) {
        return { kind: "numeric", arg: img(ctx.Identifier[0]) };
    }
    featureOpClamp(ctx) {
        return {
            kind: "clamp",
            arg: img(ctx.Identifier[0]),
            min: parseFloat(img(ctx.NumberLiteral[0])),
            max: parseFloat(img(ctx.NumberLiteral[1])),
        };
    }
    featureOpScale(ctx) {
        return {
            kind: "scale",
            arg: img(ctx.Identifier[0]),
            factor: parseFloat(img(ctx.NumberLiteral[0])),
        };
    }
    regionDecl(ctx) {
        const name = img(ctx.Identifier[0]);
        const populations = ctx.populationDecl
            ? ctx.populationDecl.map((p) => this.visit(p))
            : [];
        const projections = ctx.projectionDecl
            ? ctx.projectionDecl.map((p) => this.visit(p))
            : [];
        return { kind: "Region", name, populations, projections, loc: loc(ctx.KwRegion[0]) };
    }
    populationDecl(ctx) {
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
    statePopBody(ctx) {
        return {
            slots: parseInt(img(ctx.NumberLiteral[0]), 10),
            decay: parseTime(ctx.TimeLiteral[0]),
            merge: stripQuotes(img(ctx.StringLiteral[0])),
        };
    }
    spikingPopBody(ctx) {
        return {
            neurons: parseInt(img(ctx.NumberLiteral[0]), 10),
            tauMs: parseTime(ctx.TimeLiteral[0]),
            refrMs: parseTime(ctx.TimeLiteral[1]),
            targetRate: parseFloat(img(ctx.NumberLiteral[1])),
            inhibition: stripQuotes(img(ctx.StringLiteral[0])),
        };
    }
    recurrentPopBody(ctx) {
        return {
            neurons: parseInt(img(ctx.NumberLiteral[0]), 10),
            dt: parseTime(ctx.TimeLiteral[0]),
        };
    }
    ratePopBody(ctx) {
        return { units: this.visit(ctx.numberOrLen) };
    }
    wtaPopBody(ctx) {
        return { units: this.visit(ctx.numberOrLen) };
    }
    numberOrLen(ctx) {
        if (ctx.KwLen) {
            return { kind: "len", ref: img(ctx.Identifier[0]) };
        }
        return { kind: "literal", value: parseInt(img(ctx.NumberLiteral[0]), 10) };
    }
    projectionDecl(ctx) {
        const names = ctx.qualifiedName.map((qn) => this.visit(qn));
        const from = names[0];
        const to = names[1];
        const topology = this.visit(ctx.topologyExpr);
        const weightInit = ctx.weightInitExpr
            ? this.visit(ctx.weightInitExpr)
            : undefined;
        const rule = ctx.learningRuleExpr
            ? this.visit(ctx.learningRuleExpr)
            : undefined;
        return {
            kind: "Projection", from, to, topology,
            weightInit, rule,
            loc: loc(ctx.KwProjection[0]),
        };
    }
    qualifiedName(ctx) {
        const parts = ctx.Identifier.map((t) => img(t));
        return parts.join(".");
    }
    topologyExpr(ctx) {
        if (ctx.KwDense)
            return { kind: "dense" };
        if (ctx.KwLinear)
            return { kind: "linear" };
        if (ctx.sparseRandomExpr)
            return this.visit(ctx.sparseRandomExpr);
        if (ctx.localExpr)
            return this.visit(ctx.localExpr);
        if (ctx.softmaxExpr)
            return this.visit(ctx.softmaxExpr);
        throw new Error("Unknown topology");
    }
    sparseRandomExpr(ctx) {
        return {
            kind: "sparse_random",
            p: parseFloat(img(ctx.NumberLiteral[0])),
            seed: parseInt(img(ctx.NumberLiteral[1]), 10),
        };
    }
    localExpr(ctx) {
        return { kind: "local", radius: parseInt(img(ctx.NumberLiteral[0]), 10) };
    }
    softmaxExpr(ctx) {
        return { kind: "softmax", temperature: parseFloat(img(ctx.NumberLiteral[0])) };
    }
    weightInitExpr(ctx) {
        if (ctx.normalInitExpr)
            return this.visit(ctx.normalInitExpr);
        if (ctx.uniformInitExpr)
            return this.visit(ctx.uniformInitExpr);
        if (ctx.constantInitExpr)
            return this.visit(ctx.constantInitExpr);
        throw new Error("Unknown weight init");
    }
    normalInitExpr(ctx) {
        return { kind: "normal", mu: parseFloat(img(ctx.NumberLiteral[0])), sigma: parseFloat(img(ctx.NumberLiteral[1])) };
    }
    uniformInitExpr(ctx) {
        return { kind: "uniform", a: parseFloat(img(ctx.NumberLiteral[0])), b: parseFloat(img(ctx.NumberLiteral[1])) };
    }
    constantInitExpr(ctx) {
        return { kind: "constant", c: parseFloat(img(ctx.NumberLiteral[0])) };
    }
    learningRuleExpr(ctx) {
        if (ctx.KwNone)
            return { kind: "none" };
        return { kind: "hebbian", trace: parseTime(ctx.TimeLiteral[0]) };
    }
    circuitDecl(ctx) {
        const name = img(ctx.Identifier[0]);
        const actions = this.visit(ctx.identifierList);
        const populations = ctx.populationDecl
            ? ctx.populationDecl.map((p) => this.visit(p))
            : [];
        const projections = ctx.projectionDecl
            ? ctx.projectionDecl.map((p) => this.visit(p))
            : [];
        const modulators = ctx.modulatorDecl
            ? ctx.modulatorDecl.map((m) => this.visit(m))
            : [];
        const plasticity = ctx.plasticityDecl
            ? ctx.plasticityDecl.map((p) => this.visit(p))
            : [];
        return {
            kind: "Circuit", name, actions, populations, projections,
            modulators, plasticity, loc: loc(ctx.KwCircuit[0]),
        };
    }
    plasticityDecl(ctx) {
        const target = img(ctx.Identifier[0]);
        const rule = img(ctx.Identifier[1]);
        return { kind: "Plasticity", target, rule, loc: loc(ctx.KwPlasticity[0]) };
    }
    modulatorDecl(ctx) {
        const name = img(ctx.Identifier[0]);
        return { kind: "Modulator", name, source: "reward", loc: loc(ctx.KwModulator[0]) };
    }
    effectorDecl(ctx) {
        const name = img(ctx.Identifier[0]);
        const bindings = ctx.bindingDecl
            ? ctx.bindingDecl.map((b) => this.visit(b))
            : [];
        return { kind: "Effector", name, bindings, loc: loc(ctx.KwEffector[0]) };
    }
    bindingDecl(ctx) {
        const action = img(ctx.Identifier[0]);
        if (ctx.KwNoop) {
            return { action, target: { kind: "noop" }, loc: loc(ctx.KwBind[0]) };
        }
        const expr = stripQuotes(img(ctx.StringLiteral[0]));
        return { action, target: { kind: "js", expr }, loc: loc(ctx.KwBind[0]) };
    }
    runtimeDecl(ctx) {
        let tick;
        if (ctx.KwRAF) {
            tick = "RAF";
        }
        else if (ctx.TimeLiteral) {
            tick = parseTime(ctx.TimeLiteral[0]);
        }
        else if (ctx.Identifier) {
            tick = img(ctx.Identifier[0]);
        }
        else {
            tick = "RAF";
        }
        const steps = ctx.stepCommand
            ? ctx.stepCommand.map((s) => this.visit(s))
            : [];
        const guards = ctx.guardDecl
            ? ctx.guardDecl.map((g) => this.visit(g))
            : [];
        return { kind: "Runtime", tick, steps, guards, loc: loc(ctx.KwRuntime[0]) };
    }
    stepCommand(ctx) {
        if (ctx.ingestStep)
            return this.visit(ctx.ingestStep);
        if (ctx.runStep)
            return this.visit(ctx.runStep);
        if (ctx.emitStep)
            return this.visit(ctx.emitStep);
        throw new Error("Unknown step command");
    }
    ingestStep(ctx) {
        const sensors = this.visit(ctx.identifierList);
        return { kind: "ingest", sensors };
    }
    runStep(ctx) {
        const module = this.visit(ctx.qualifiedName);
        const dt = ctx.TimeLiteral
            ? parseTime(ctx.TimeLiteral[0])
            : undefined;
        const when = ctx.Identifier?.[0]
            ? img(ctx.Identifier[0])
            : undefined;
        return { kind: "run", module, dt, when };
    }
    emitStep(ctx) {
        const effector = img(ctx.Identifier[0]);
        const from = this.visit(ctx.qualifiedName);
        const winnerOnly = !!ctx.KwWinnerOnly;
        return { kind: "emit", effector, from, winnerOnly };
    }
    guardDecl(ctx) {
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
    identifierList(ctx) {
        return ctx.Identifier.map((t) => img(t));
    }
}
exports.visitorInstance = new BrainWebCstVisitor();
//# sourceMappingURL=visitor.js.map