"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function validate(app) {
    const diags = [];
    const symbols = buildSymbolTable(app, diags);
    resolveNames(app, symbols, diags);
    checkTypeSanity(app, diags);
    checkBindingSafety(app, diags);
    return diags;
}
function buildSymbolTable(app, diags) {
    const symbols = {
        sensors: new Map(),
        encoders: new Map(),
        populations: new Map(),
        circuits: new Map(),
        effectors: new Map(),
        allModules: new Set(),
    };
    for (const decl of app.declarations) {
        switch (decl.kind) {
            case "Sensor":
                if (symbols.sensors.has(decl.name)) {
                    diags.push({ level: "error", message: `Duplicate sensor: ${decl.name}`, line: decl.loc.startLine });
                }
                symbols.sensors.set(decl.name, decl);
                break;
            case "Encoder":
                if (symbols.encoders.has(decl.name)) {
                    diags.push({ level: "error", message: `Duplicate encoder: ${decl.name}`, line: decl.loc.startLine });
                }
                symbols.encoders.set(decl.name, decl);
                symbols.allModules.add(decl.name);
                break;
            case "Region":
                registerRegion(decl, symbols, diags);
                break;
            case "Circuit":
                if (symbols.circuits.has(decl.name)) {
                    diags.push({ level: "error", message: `Duplicate circuit: ${decl.name}`, line: decl.loc.startLine });
                }
                symbols.circuits.set(decl.name, decl);
                symbols.allModules.add(decl.name);
                for (const pop of decl.populations) {
                    const qn = `${decl.name}.${pop.name}`;
                    symbols.populations.set(qn, pop);
                    symbols.allModules.add(qn);
                }
                break;
            case "Effector":
                if (symbols.effectors.has(decl.name)) {
                    diags.push({ level: "error", message: `Duplicate effector: ${decl.name}`, line: decl.loc.startLine });
                }
                symbols.effectors.set(decl.name, decl);
                break;
            default:
                break;
        }
    }
    return symbols;
}
function registerRegion(region, symbols, diags) {
    for (const pop of region.populations) {
        const qn = `${region.name}.${pop.name}`;
        if (symbols.populations.has(qn)) {
            diags.push({ level: "error", message: `Duplicate population: ${qn}`, line: pop.loc.startLine });
        }
        symbols.populations.set(qn, pop);
        symbols.allModules.add(qn);
    }
}
function resolveNames(app, symbols, diags) {
    for (const decl of app.declarations) {
        if (decl.kind === "Encoder") {
            for (const input of decl.inputs) {
                if (input.sensor !== "*" && !symbols.sensors.has(input.sensor)) {
                    diags.push({
                        level: "error",
                        message: `Encoder "${decl.name}" references unknown sensor: ${input.sensor}`,
                        line: decl.loc.startLine,
                    });
                }
            }
        }
        if (decl.kind === "Region") {
            for (const proj of decl.projections) {
                checkProjectionRefs(proj, symbols, diags, decl.name);
            }
        }
        if (decl.kind === "Circuit") {
            for (const proj of decl.projections) {
                checkProjectionRefs(proj, symbols, diags, decl.name);
            }
            // Check action bindings exist in some effector
            const allBoundActions = new Set();
            for (const eff of symbols.effectors.values()) {
                for (const b of eff.bindings) {
                    allBoundActions.add(b.action);
                }
            }
            for (const action of decl.actions) {
                if (!allBoundActions.has(action)) {
                    diags.push({
                        level: "warning",
                        message: `Circuit "${decl.name}" action "${action}" has no effector binding`,
                        line: decl.loc.startLine,
                    });
                }
            }
        }
        if (decl.kind === "Runtime") {
            for (const step of decl.steps) {
                if (step.kind === "ingest") {
                    for (const s of step.sensors) {
                        if (!symbols.sensors.has(s)) {
                            diags.push({ level: "error", message: `Runtime ingest references unknown sensor: ${s}` });
                        }
                    }
                }
                if (step.kind === "run") {
                    if (!symbols.allModules.has(step.module)) {
                        diags.push({ level: "error", message: `Runtime run references unknown module: ${step.module}` });
                    }
                }
                if (step.kind === "emit") {
                    if (!symbols.effectors.has(step.effector)) {
                        diags.push({ level: "error", message: `Runtime emit references unknown effector: ${step.effector}` });
                    }
                }
            }
        }
    }
}
function resolveModuleRef(name, symbols, scope) {
    if (symbols.allModules.has(name) || symbols.populations.has(name))
        return true;
    // Try qualifying with scope prefix (circuit or region)
    if (scope) {
        const qualified = `${scope}.${name}`;
        if (symbols.allModules.has(qualified) || symbols.populations.has(qualified))
            return true;
    }
    return false;
}
function checkProjectionRefs(proj, symbols, diags, scope) {
    if (!resolveModuleRef(proj.from, symbols, scope)) {
        diags.push({
            level: "error",
            message: `Projection from unknown module: ${proj.from}`,
            line: proj.loc.startLine,
        });
    }
    if (!resolveModuleRef(proj.to, symbols, scope)) {
        diags.push({
            level: "error",
            message: `Projection to unknown module: ${proj.to}`,
            line: proj.loc.startLine,
        });
    }
}
function checkTypeSanity(app, diags) {
    for (const decl of app.declarations) {
        if (decl.kind === "Encoder") {
            if (decl.outDim <= 0) {
                diags.push({ level: "error", message: `Encoder "${decl.name}" dim must be > 0`, line: decl.loc.startLine });
            }
        }
        if (decl.kind === "Region") {
            for (const pop of decl.populations) {
                checkPopSanity(pop, diags);
            }
        }
        if (decl.kind === "Circuit") {
            if (decl.actions.length === 0) {
                diags.push({ level: "error", message: `Circuit "${decl.name}" must have at least one action`, line: decl.loc.startLine });
            }
            for (const pop of decl.populations) {
                checkPopSanity(pop, diags);
            }
        }
    }
}
function checkPopSanity(pop, diags) {
    if (pop.kind === "StatePop" && pop.slots <= 0) {
        diags.push({ level: "error", message: `Population "${pop.name}" slots must be > 0`, line: pop.loc.startLine });
    }
    if (pop.kind === "SpikingPop" && pop.neurons <= 0) {
        diags.push({ level: "error", message: `Population "${pop.name}" neurons must be > 0`, line: pop.loc.startLine });
    }
    if (pop.kind === "RecurrentPop" && pop.neurons <= 0) {
        diags.push({ level: "error", message: `Population "${pop.name}" neurons must be > 0`, line: pop.loc.startLine });
    }
}
// Restricted js("...") binding validation
const JS_BINDING_RE = /^fx\.\w+\((?:(?:ctx(?:\.\w+)?|"[^"]*"|\d+(?:\.\d+)?)(?:\s*,\s*(?:ctx(?:\.\w+)?|"[^"]*"|\d+(?:\.\d+)?))*)?\)$/;
function checkBindingSafety(app, diags) {
    for (const decl of app.declarations) {
        if (decl.kind === "Effector") {
            for (const binding of decl.bindings) {
                if (binding.target.kind === "js") {
                    if (!JS_BINDING_RE.test(binding.target.expr)) {
                        diags.push({
                            level: "error",
                            message: `Unsafe js binding for "${binding.action}": "${binding.target.expr}". ` +
                                `Must match fx.<ident>(<ctx|ctx.field|literal>...)`,
                            line: binding.loc.startLine,
                        });
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=validate.js.map