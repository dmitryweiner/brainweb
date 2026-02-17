"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserInstance = exports.BrainWebParser = void 0;
const chevrotain_1 = require("chevrotain");
const lexer_1 = require("./lexer");
class BrainWebParser extends chevrotain_1.CstParser {
    constructor() {
        super(lexer_1.allTokens, { recoveryEnabled: false });
        // ── Top-level ──
        this.program = this.RULE("program", () => {
            this.SUBRULE(this.appDecl);
        });
        this.appDecl = this.RULE("appDecl", () => {
            this.CONSUME(lexer_1.KwApp);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.LBrace);
            this.MANY(() => {
                this.SUBRULE(this.declaration);
            });
            this.CONSUME(lexer_1.RBrace);
        });
        this.declaration = this.RULE("declaration", () => {
            this.OR([
                { ALT: () => this.SUBRULE(this.sensorDecl) },
                { ALT: () => this.SUBRULE(this.encoderDecl) },
                { ALT: () => this.SUBRULE(this.regionDecl) },
                { ALT: () => this.SUBRULE(this.circuitDecl) },
                { ALT: () => this.SUBRULE(this.modulatorDecl) },
                { ALT: () => this.SUBRULE(this.effectorDecl) },
                { ALT: () => this.SUBRULE(this.runtimeDecl) },
            ]);
        });
        // ── Sensor: sensor <Name> : events(A, B, C) ──
        this.sensorDecl = this.RULE("sensorDecl", () => {
            this.CONSUME(lexer_1.KwSensor);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.Colon);
            this.CONSUME(lexer_1.KwEvents);
            this.CONSUME(lexer_1.LParen);
            this.SUBRULE(this.identifierList);
            this.CONSUME(lexer_1.RParen);
        });
        // ── Encoder ──
        this.encoderDecl = this.RULE("encoderDecl", () => {
            this.CONSUME(lexer_1.KwEncoder);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.LBrace);
            // in = [...]
            this.CONSUME(lexer_1.KwIn);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME(lexer_1.LBracket);
            this.SUBRULE(this.sensorPatternList);
            this.CONSUME(lexer_1.RBracket);
            // out = FeatureVector dim=N
            this.CONSUME(lexer_1.KwOut);
            this.CONSUME2(lexer_1.Equals);
            this.CONSUME(lexer_1.KwFeatureVector);
            this.CONSUME(lexer_1.KwDim);
            this.CONSUME3(lexer_1.Equals);
            this.CONSUME(lexer_1.NumberLiteral);
            // policy = { ... }
            this.CONSUME(lexer_1.KwPolicy);
            this.CONSUME4(lexer_1.Equals);
            this.CONSUME2(lexer_1.LBrace);
            this.MANY(() => {
                this.SUBRULE(this.featureOp);
            });
            this.CONSUME2(lexer_1.RBrace);
            this.CONSUME(lexer_1.RBrace);
        });
        this.sensorPatternList = this.RULE("sensorPatternList", () => {
            this.SUBRULE(this.sensorPattern);
            this.MANY(() => {
                this.CONSUME(lexer_1.Comma);
                this.SUBRULE2(this.sensorPattern);
            });
        });
        this.sensorPattern = this.RULE("sensorPattern", () => {
            this.OR([
                { ALT: () => this.CONSUME(lexer_1.Identifier) },
                { ALT: () => this.CONSUME(lexer_1.Star) },
            ]);
            this.CONSUME(lexer_1.Dot);
            this.OR2([
                { ALT: () => this.CONSUME2(lexer_1.Identifier) },
                { ALT: () => this.CONSUME2(lexer_1.Star) },
            ]);
        });
        this.featureOp = this.RULE("featureOp", () => {
            this.OR([
                { ALT: () => this.SUBRULE(this.featureOpOnehot) },
                { ALT: () => this.SUBRULE(this.featureOpBucket) },
                { ALT: () => this.SUBRULE(this.featureOpHash) },
                { ALT: () => this.SUBRULE(this.featureOpNumeric) },
                { ALT: () => this.SUBRULE(this.featureOpClamp) },
                { ALT: () => this.SUBRULE(this.featureOpScale) },
            ]);
        });
        this.featureOpOnehot = this.RULE("featureOpOnehot", () => {
            this.CONSUME(lexer_1.KwOnehot);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.RParen);
        });
        this.featureOpBucket = this.RULE("featureOpBucket", () => {
            this.CONSUME(lexer_1.KwBucket);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.Comma);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.featureOpHash = this.RULE("featureOpHash", () => {
            this.CONSUME(lexer_1.KwHash);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.Comma);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.featureOpNumeric = this.RULE("featureOpNumeric", () => {
            this.CONSUME(lexer_1.KwNumeric);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.RParen);
        });
        this.featureOpClamp = this.RULE("featureOpClamp", () => {
            this.CONSUME(lexer_1.KwClamp);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.Comma);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME2(lexer_1.Comma);
            this.CONSUME2(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.featureOpScale = this.RULE("featureOpScale", () => {
            this.CONSUME(lexer_1.KwScale);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.Comma);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        // ── Region ──
        this.regionDecl = this.RULE("regionDecl", () => {
            this.CONSUME(lexer_1.KwRegion);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.LBrace);
            this.MANY(() => {
                this.OR([
                    { ALT: () => this.SUBRULE(this.populationDecl) },
                    { ALT: () => this.SUBRULE(this.projectionDecl) },
                ]);
            });
            this.CONSUME(lexer_1.RBrace);
        });
        // ── Population ──
        this.populationDecl = this.RULE("populationDecl", () => {
            this.CONSUME(lexer_1.KwPopulation);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.Colon);
            this.OR([
                { ALT: () => this.SUBRULE(this.statePopBody) },
                { ALT: () => this.SUBRULE(this.spikingPopBody) },
                { ALT: () => this.SUBRULE(this.recurrentPopBody) },
                { ALT: () => this.SUBRULE(this.ratePopBody) },
                { ALT: () => this.SUBRULE(this.wtaPopBody) },
            ]);
        });
        this.statePopBody = this.RULE("statePopBody", () => {
            this.CONSUME(lexer_1.KwState);
            this.CONSUME(lexer_1.LParen);
            // slots=N
            this.CONSUME(lexer_1.KwSlots);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.Comma);
            // decay=time
            this.CONSUME(lexer_1.KwDecay);
            this.CONSUME2(lexer_1.Equals);
            this.CONSUME(lexer_1.TimeLiteral);
            this.CONSUME2(lexer_1.Comma);
            // merge="mode"
            this.CONSUME(lexer_1.KwMerge);
            this.CONSUME3(lexer_1.Equals);
            this.CONSUME(lexer_1.StringLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.spikingPopBody = this.RULE("spikingPopBody", () => {
            this.CONSUME(lexer_1.KwSpiking);
            this.CONSUME(lexer_1.LParen);
            // neurons=N
            this.CONSUME(lexer_1.KwNeurons);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.Comma);
            // neuron=LIF(tau=time, refr=time)
            this.CONSUME(lexer_1.KwNeuron);
            this.CONSUME2(lexer_1.Equals);
            this.CONSUME(lexer_1.KwLIF);
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.KwTau);
            this.CONSUME3(lexer_1.Equals);
            this.CONSUME(lexer_1.TimeLiteral);
            this.CONSUME2(lexer_1.Comma);
            this.CONSUME(lexer_1.KwRefr);
            this.CONSUME4(lexer_1.Equals);
            this.CONSUME2(lexer_1.TimeLiteral);
            this.CONSUME2(lexer_1.RParen);
            this.CONSUME3(lexer_1.Comma);
            // target_rate=Hz
            this.CONSUME(lexer_1.KwTargetRate);
            this.CONSUME5(lexer_1.Equals);
            this.CONSUME2(lexer_1.NumberLiteral);
            this.CONSUME4(lexer_1.Comma);
            // inhibition="mode"
            this.CONSUME(lexer_1.KwInhibition);
            this.CONSUME6(lexer_1.Equals);
            this.CONSUME(lexer_1.StringLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.recurrentPopBody = this.RULE("recurrentPopBody", () => {
            this.CONSUME(lexer_1.KwRecurrent);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.KwNeurons);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.Comma);
            this.CONSUME(lexer_1.KwDt);
            this.CONSUME2(lexer_1.Equals);
            this.CONSUME(lexer_1.TimeLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.ratePopBody = this.RULE("ratePopBody", () => {
            this.CONSUME(lexer_1.KwRate);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.KwUnits);
            this.CONSUME(lexer_1.Equals);
            this.SUBRULE(this.numberOrLen);
            this.CONSUME(lexer_1.RParen);
        });
        this.wtaPopBody = this.RULE("wtaPopBody", () => {
            this.CONSUME(lexer_1.KwWinnerTakeAll);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.KwUnits);
            this.CONSUME(lexer_1.Equals);
            this.SUBRULE(this.numberOrLen);
            this.CONSUME(lexer_1.RParen);
        });
        this.numberOrLen = this.RULE("numberOrLen", () => {
            this.OR([
                {
                    ALT: () => {
                        this.CONSUME(lexer_1.KwLen);
                        this.CONSUME(lexer_1.LParen);
                        this.CONSUME(lexer_1.Identifier);
                        this.CONSUME(lexer_1.RParen);
                    },
                },
                { ALT: () => this.CONSUME(lexer_1.NumberLiteral) },
            ]);
        });
        // ── Projection ──
        this.projectionDecl = this.RULE("projectionDecl", () => {
            this.CONSUME(lexer_1.KwProjection);
            this.SUBRULE(this.qualifiedName);
            this.CONSUME(lexer_1.Arrow);
            this.SUBRULE2(this.qualifiedName);
            this.CONSUME(lexer_1.LBrace);
            // topology = ...
            this.CONSUME(lexer_1.KwTopology);
            this.CONSUME(lexer_1.Equals);
            this.SUBRULE(this.topologyExpr);
            // optional weight_init
            this.OPTION(() => {
                this.CONSUME(lexer_1.KwWeightInit);
                this.CONSUME2(lexer_1.Equals);
                this.SUBRULE(this.weightInitExpr);
            });
            // optional rule
            this.OPTION2(() => {
                this.CONSUME(lexer_1.KwRule);
                this.CONSUME3(lexer_1.Equals);
                this.SUBRULE(this.learningRuleExpr);
            });
            this.CONSUME(lexer_1.RBrace);
        });
        this.qualifiedName = this.RULE("qualifiedName", () => {
            this.CONSUME(lexer_1.Identifier);
            this.MANY(() => {
                this.CONSUME(lexer_1.Dot);
                this.CONSUME2(lexer_1.Identifier);
            });
        });
        this.topologyExpr = this.RULE("topologyExpr", () => {
            this.OR([
                { ALT: () => this.CONSUME(lexer_1.KwDense) },
                { ALT: () => this.SUBRULE(this.sparseRandomExpr) },
                { ALT: () => this.SUBRULE(this.localExpr) },
                { ALT: () => this.CONSUME(lexer_1.KwLinear) },
                { ALT: () => this.SUBRULE(this.softmaxExpr) },
            ]);
        });
        this.sparseRandomExpr = this.RULE("sparseRandomExpr", () => {
            this.CONSUME(lexer_1.KwSparseRandom);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.KwP);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.Comma);
            this.CONSUME(lexer_1.KwSeed);
            this.CONSUME2(lexer_1.Equals);
            this.CONSUME2(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.localExpr = this.RULE("localExpr", () => {
            this.CONSUME(lexer_1.KwLocal);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.KwRadius);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.softmaxExpr = this.RULE("softmaxExpr", () => {
            this.CONSUME(lexer_1.KwSoftmax);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.KwTemp);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.weightInitExpr = this.RULE("weightInitExpr", () => {
            this.OR([
                { ALT: () => this.SUBRULE(this.normalInitExpr) },
                { ALT: () => this.SUBRULE(this.uniformInitExpr) },
                { ALT: () => this.SUBRULE(this.constantInitExpr) },
            ]);
        });
        this.normalInitExpr = this.RULE("normalInitExpr", () => {
            this.CONSUME(lexer_1.KwNormal);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.Comma);
            this.CONSUME2(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.uniformInitExpr = this.RULE("uniformInitExpr", () => {
            this.CONSUME(lexer_1.KwUniform);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.Comma);
            this.CONSUME2(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.constantInitExpr = this.RULE("constantInitExpr", () => {
            this.CONSUME(lexer_1.KwConstant);
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.NumberLiteral);
            this.CONSUME(lexer_1.RParen);
        });
        this.learningRuleExpr = this.RULE("learningRuleExpr", () => {
            this.OR([
                {
                    ALT: () => {
                        this.CONSUME(lexer_1.KwHebbian);
                        this.CONSUME(lexer_1.LParen);
                        this.CONSUME(lexer_1.KwTrace);
                        this.CONSUME(lexer_1.Equals);
                        this.CONSUME(lexer_1.TimeLiteral);
                        this.CONSUME(lexer_1.RParen);
                    },
                },
                { ALT: () => this.CONSUME(lexer_1.KwNone) },
            ]);
        });
        // ── Circuit ──
        this.circuitDecl = this.RULE("circuitDecl", () => {
            this.CONSUME(lexer_1.KwCircuit);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.LBrace);
            // actions = [...]
            this.CONSUME(lexer_1.KwActions);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME(lexer_1.LBracket);
            this.SUBRULE(this.identifierList);
            this.CONSUME(lexer_1.RBracket);
            // body: populations, projections, modulators, plasticity
            this.MANY(() => {
                this.OR([
                    { ALT: () => this.SUBRULE(this.populationDecl) },
                    { ALT: () => this.SUBRULE(this.projectionDecl) },
                    { ALT: () => this.SUBRULE(this.modulatorDecl) },
                    { ALT: () => this.SUBRULE(this.plasticityDecl) },
                ]);
            });
            this.CONSUME(lexer_1.RBrace);
        });
        this.plasticityDecl = this.RULE("plasticityDecl", () => {
            this.CONSUME(lexer_1.KwPlasticity);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.LBrace);
            this.CONSUME(lexer_1.KwRule);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME2(lexer_1.Identifier);
            // optional params in parens
            this.OPTION(() => {
                this.CONSUME(lexer_1.LParen);
                this.MANY(() => {
                    this.CONSUME3(lexer_1.Identifier);
                    this.CONSUME2(lexer_1.Equals);
                    this.OR([
                        { ALT: () => this.CONSUME(lexer_1.TimeLiteral) },
                        { ALT: () => this.CONSUME(lexer_1.NumberLiteral) },
                        { ALT: () => this.CONSUME(lexer_1.StringLiteral) },
                    ]);
                    this.OPTION2(() => this.CONSUME(lexer_1.Comma));
                });
                this.CONSUME(lexer_1.RParen);
            });
            this.CONSUME(lexer_1.RBrace);
        });
        // ── Modulator ──
        this.modulatorDecl = this.RULE("modulatorDecl", () => {
            this.CONSUME(lexer_1.KwModulator);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.LBrace);
            this.CONSUME(lexer_1.KwSource);
            this.CONSUME(lexer_1.Equals);
            this.CONSUME(lexer_1.KwReward);
            this.CONSUME(lexer_1.LParen);
            // from=Pattern, from=Pattern ...
            this.MANY(() => {
                this.CONSUME(lexer_1.KwFrom);
                this.CONSUME2(lexer_1.Equals);
                this.SUBRULE(this.sensorPattern);
                this.OPTION(() => this.CONSUME(lexer_1.Comma));
            });
            this.CONSUME(lexer_1.RParen);
            this.CONSUME(lexer_1.RBrace);
        });
        // ── Effector ──
        this.effectorDecl = this.RULE("effectorDecl", () => {
            this.CONSUME(lexer_1.KwEffector);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.LBrace);
            this.MANY(() => {
                this.SUBRULE(this.bindingDecl);
            });
            this.CONSUME(lexer_1.RBrace);
        });
        this.bindingDecl = this.RULE("bindingDecl", () => {
            this.CONSUME(lexer_1.KwBind);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.Arrow);
            this.OR([
                {
                    ALT: () => {
                        this.CONSUME(lexer_1.KwJs);
                        this.CONSUME(lexer_1.LParen);
                        this.CONSUME(lexer_1.StringLiteral);
                        this.CONSUME(lexer_1.RParen);
                    },
                },
                { ALT: () => this.CONSUME(lexer_1.KwNoop) },
            ]);
        });
        // ── Runtime ──
        this.runtimeDecl = this.RULE("runtimeDecl", () => {
            this.CONSUME(lexer_1.KwRuntime);
            this.CONSUME(lexer_1.LBrace);
            // tick = RAF | time
            this.CONSUME(lexer_1.KwTick);
            this.CONSUME(lexer_1.Equals);
            this.OR([
                { ALT: () => this.CONSUME(lexer_1.KwRAF) },
                { ALT: () => this.CONSUME(lexer_1.Identifier) },
                { ALT: () => this.CONSUME(lexer_1.TimeLiteral) },
            ]);
            // step { ... }
            this.CONSUME(lexer_1.KwStep);
            this.CONSUME2(lexer_1.LBrace);
            this.MANY(() => {
                this.SUBRULE(this.stepCommand);
            });
            this.CONSUME2(lexer_1.RBrace);
            // guards { ... }
            this.OPTION(() => {
                this.CONSUME(lexer_1.KwGuards);
                this.CONSUME3(lexer_1.LBrace);
                this.MANY2(() => {
                    this.SUBRULE(this.guardDecl);
                });
                this.CONSUME3(lexer_1.RBrace);
            });
            this.CONSUME(lexer_1.RBrace);
        });
        this.stepCommand = this.RULE("stepCommand", () => {
            this.OR([
                { ALT: () => this.SUBRULE(this.ingestStep) },
                { ALT: () => this.SUBRULE(this.runStep) },
                { ALT: () => this.SUBRULE(this.emitStep) },
            ]);
        });
        this.ingestStep = this.RULE("ingestStep", () => {
            this.CONSUME(lexer_1.KwIngest);
            this.CONSUME(lexer_1.LBracket);
            this.SUBRULE(this.identifierList);
            this.CONSUME(lexer_1.RBracket);
        });
        this.runStep = this.RULE("runStep", () => {
            this.CONSUME(lexer_1.KwRun);
            this.SUBRULE(this.qualifiedName);
            this.OPTION(() => {
                this.CONSUME(lexer_1.KwDt);
                this.CONSUME(lexer_1.Equals);
                this.CONSUME(lexer_1.TimeLiteral);
            });
            this.OPTION2(() => {
                this.CONSUME(lexer_1.KwWhen);
                this.CONSUME2(lexer_1.Equals);
                this.CONSUME(lexer_1.Identifier);
            });
        });
        this.emitStep = this.RULE("emitStep", () => {
            this.CONSUME(lexer_1.KwEmit);
            this.CONSUME(lexer_1.Identifier);
            this.CONSUME(lexer_1.KwFrom);
            this.CONSUME(lexer_1.Equals);
            this.SUBRULE(this.qualifiedName);
            this.OPTION(() => {
                this.CONSUME(lexer_1.KwWinnerOnly);
            });
        });
        this.guardDecl = this.RULE("guardDecl", () => {
            this.OR([
                {
                    ALT: () => {
                        this.CONSUME(lexer_1.KwMaxEffectsPerSec);
                        this.CONSUME(lexer_1.Equals);
                        this.CONSUME(lexer_1.NumberLiteral);
                    },
                },
                {
                    ALT: () => {
                        this.CONSUME(lexer_1.KwSuppressRepeats);
                        this.CONSUME(lexer_1.LParen);
                        this.CONSUME(lexer_1.KwWindow);
                        this.CONSUME2(lexer_1.Equals);
                        this.CONSUME(lexer_1.TimeLiteral);
                        this.CONSUME(lexer_1.RParen);
                    },
                },
                {
                    ALT: () => {
                        this.CONSUME(lexer_1.KwKeepTargetRate);
                        this.CONSUME2(lexer_1.LParen);
                        this.CONSUME(lexer_1.Identifier);
                        this.CONSUME(lexer_1.Comma);
                        this.CONSUME2(lexer_1.NumberLiteral);
                        this.CONSUME2(lexer_1.RParen);
                    },
                },
            ]);
        });
        // ── Helpers ──
        this.identifierList = this.RULE("identifierList", () => {
            this.CONSUME(lexer_1.Identifier);
            this.MANY(() => {
                this.CONSUME(lexer_1.Comma);
                this.CONSUME2(lexer_1.Identifier);
            });
        });
        this.performSelfAnalysis();
    }
}
exports.BrainWebParser = BrainWebParser;
exports.parserInstance = new BrainWebParser();
//# sourceMappingURL=parser.js.map