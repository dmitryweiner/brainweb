import { CstParser } from "chevrotain";
import {
  allTokens,
  KwApp, KwSensor, KwEncoder, KwRegion, KwPopulation, KwProjection,
  KwCircuit, KwModulator, KwEffector, KwRuntime, KwIngest, KwRun,
  KwEmit, KwBind, KwJs, KwNoop, KwEvents, KwFeatureVector, KwDim,
  KwPolicy, KwTopology, KwWeightInit, KwRule, KwActions, KwGuards,
  KwTick, KwDt, KwWhen, KwFrom, KwWinnerOnly, KwStep, KwIn, KwOut,
  KwSlots, KwDecay, KwMerge, KwNeurons, KwNeuron, KwTargetRate,
  KwInhibition, KwUnits, KwLen, KwMaxEffectsPerSec, KwSuppressRepeats,
  KwWindow, KwKeepTargetRate, KwWinnerTakeAll, KwSoftmax, KwTemp,
  KwRAF, KwState, KwSpiking, KwRecurrent, KwRate, KwLIF, KwTau,
  KwRefr, KwSource, KwReward, KwPlasticity, KwDense, KwSparseRandom,
  KwLocal, KwLinear, KwNormal, KwUniform, KwConstant, KwHebbian,
  KwNone, KwTrace, KwOnehot, KwBucket, KwHash, KwNumeric, KwClamp,
  KwScale, KwP, KwSeed, KwRadius, KwMu, KwSigma, KwA, KwB, KwC,
  KwMin, KwMax, KwFactor, KwRewardHebbian,
  Arrow, LBrace, RBrace, LParen, RParen, LBracket, RBracket,
  Equals, Comma, Dot, Colon, Star,
  StringLiteral, TimeLiteral, NumberLiteral, Identifier,
} from "./lexer.js";

export class BrainWebParser extends CstParser {
  constructor() {
    super(allTokens, { recoveryEnabled: false });
    this.performSelfAnalysis();
  }

  // ── Top-level ──

  public program = this.RULE("program", () => {
    this.SUBRULE(this.appDecl);
  });

  private appDecl = this.RULE("appDecl", () => {
    this.CONSUME(KwApp);
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.declaration);
    });
    this.CONSUME(RBrace);
  });

  private declaration = this.RULE("declaration", () => {
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

  private sensorDecl = this.RULE("sensorDecl", () => {
    this.CONSUME(KwSensor);
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.CONSUME(KwEvents);
    this.CONSUME(LParen);
    this.SUBRULE(this.identifierList);
    this.CONSUME(RParen);
  });

  // ── Encoder ──

  private encoderDecl = this.RULE("encoderDecl", () => {
    this.CONSUME(KwEncoder);
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    // in = [...]
    this.CONSUME(KwIn);
    this.CONSUME(Equals);
    this.CONSUME(LBracket);
    this.SUBRULE(this.sensorPatternList);
    this.CONSUME(RBracket);
    // out = FeatureVector dim=N
    this.CONSUME(KwOut);
    this.CONSUME2(Equals);
    this.CONSUME(KwFeatureVector);
    this.CONSUME(KwDim);
    this.CONSUME3(Equals);
    this.CONSUME(NumberLiteral);
    // policy = { ... }
    this.CONSUME(KwPolicy);
    this.CONSUME4(Equals);
    this.CONSUME2(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.featureOp);
    });
    this.CONSUME2(RBrace);
    this.CONSUME(RBrace);
  });

  private sensorPatternList = this.RULE("sensorPatternList", () => {
    this.SUBRULE(this.sensorPattern);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.sensorPattern);
    });
  });

  private sensorPattern = this.RULE("sensorPattern", () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(Star) },
    ]);
    this.CONSUME(Dot);
    this.OR2([
      { ALT: () => this.CONSUME2(Identifier) },
      { ALT: () => this.CONSUME2(Star) },
    ]);
  });

  private featureOp = this.RULE("featureOp", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.featureOpOnehot) },
      { ALT: () => this.SUBRULE(this.featureOpBucket) },
      { ALT: () => this.SUBRULE(this.featureOpHash) },
      { ALT: () => this.SUBRULE(this.featureOpNumeric) },
      { ALT: () => this.SUBRULE(this.featureOpClamp) },
      { ALT: () => this.SUBRULE(this.featureOpScale) },
    ]);
  });

  private featureOpOnehot = this.RULE("featureOpOnehot", () => {
    this.CONSUME(KwOnehot);
    this.CONSUME(LParen);
    this.CONSUME(Identifier);
    this.CONSUME(RParen);
  });

  private featureOpBucket = this.RULE("featureOpBucket", () => {
    this.CONSUME(KwBucket);
    this.CONSUME(LParen);
    this.CONSUME(Identifier);
    this.CONSUME(Comma);
    this.CONSUME(NumberLiteral);
    this.CONSUME(RParen);
  });

  private featureOpHash = this.RULE("featureOpHash", () => {
    this.CONSUME(KwHash);
    this.CONSUME(LParen);
    this.CONSUME(Identifier);
    this.CONSUME(Comma);
    this.CONSUME(NumberLiteral);
    this.CONSUME(RParen);
  });

  private featureOpNumeric = this.RULE("featureOpNumeric", () => {
    this.CONSUME(KwNumeric);
    this.CONSUME(LParen);
    this.CONSUME(Identifier);
    this.CONSUME(RParen);
  });

  private featureOpClamp = this.RULE("featureOpClamp", () => {
    this.CONSUME(KwClamp);
    this.CONSUME(LParen);
    this.CONSUME(Identifier);
    this.CONSUME(Comma);
    this.CONSUME(NumberLiteral);
    this.CONSUME2(Comma);
    this.CONSUME2(NumberLiteral);
    this.CONSUME(RParen);
  });

  private featureOpScale = this.RULE("featureOpScale", () => {
    this.CONSUME(KwScale);
    this.CONSUME(LParen);
    this.CONSUME(Identifier);
    this.CONSUME(Comma);
    this.CONSUME(NumberLiteral);
    this.CONSUME(RParen);
  });

  // ── Region ──

  private regionDecl = this.RULE("regionDecl", () => {
    this.CONSUME(KwRegion);
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.populationDecl) },
        { ALT: () => this.SUBRULE(this.projectionDecl) },
      ]);
    });
    this.CONSUME(RBrace);
  });

  // ── Population ──

  private populationDecl = this.RULE("populationDecl", () => {
    this.CONSUME(KwPopulation);
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.SUBRULE(this.statePopBody) },
      { ALT: () => this.SUBRULE(this.spikingPopBody) },
      { ALT: () => this.SUBRULE(this.recurrentPopBody) },
      { ALT: () => this.SUBRULE(this.ratePopBody) },
      { ALT: () => this.SUBRULE(this.wtaPopBody) },
    ]);
  });

  private statePopBody = this.RULE("statePopBody", () => {
    this.CONSUME(KwState);
    this.CONSUME(LParen);
    // slots=N
    this.CONSUME(KwSlots);
    this.CONSUME(Equals);
    this.CONSUME(NumberLiteral);
    this.CONSUME(Comma);
    // decay=time
    this.CONSUME(KwDecay);
    this.CONSUME2(Equals);
    this.CONSUME(TimeLiteral);
    this.CONSUME2(Comma);
    // merge="mode"
    this.CONSUME(KwMerge);
    this.CONSUME3(Equals);
    this.CONSUME(StringLiteral);
    this.CONSUME(RParen);
  });

  private spikingPopBody = this.RULE("spikingPopBody", () => {
    this.CONSUME(KwSpiking);
    this.CONSUME(LParen);
    // neurons=N
    this.CONSUME(KwNeurons);
    this.CONSUME(Equals);
    this.CONSUME(NumberLiteral);
    this.CONSUME(Comma);
    // neuron=LIF(tau=time, refr=time)
    this.CONSUME(KwNeuron);
    this.CONSUME2(Equals);
    this.CONSUME(KwLIF);
    this.CONSUME2(LParen);
    this.CONSUME(KwTau);
    this.CONSUME3(Equals);
    this.CONSUME(TimeLiteral);
    this.CONSUME2(Comma);
    this.CONSUME(KwRefr);
    this.CONSUME4(Equals);
    this.CONSUME2(TimeLiteral);
    this.CONSUME2(RParen);
    this.CONSUME3(Comma);
    // target_rate=Hz
    this.CONSUME(KwTargetRate);
    this.CONSUME5(Equals);
    this.CONSUME2(NumberLiteral);
    this.CONSUME4(Comma);
    // inhibition="mode"
    this.CONSUME(KwInhibition);
    this.CONSUME6(Equals);
    this.CONSUME(StringLiteral);
    this.CONSUME(RParen);
  });

  private recurrentPopBody = this.RULE("recurrentPopBody", () => {
    this.CONSUME(KwRecurrent);
    this.CONSUME(LParen);
    this.CONSUME(KwNeurons);
    this.CONSUME(Equals);
    this.CONSUME(NumberLiteral);
    this.CONSUME(Comma);
    this.CONSUME(KwDt);
    this.CONSUME2(Equals);
    this.CONSUME(TimeLiteral);
    this.CONSUME(RParen);
  });

  private ratePopBody = this.RULE("ratePopBody", () => {
    this.CONSUME(KwRate);
    this.CONSUME(LParen);
    this.CONSUME(KwUnits);
    this.CONSUME(Equals);
    this.SUBRULE(this.numberOrLen);
    this.CONSUME(RParen);
  });

  private wtaPopBody = this.RULE("wtaPopBody", () => {
    this.CONSUME(KwWinnerTakeAll);
    this.CONSUME(LParen);
    this.CONSUME(KwUnits);
    this.CONSUME(Equals);
    this.SUBRULE(this.numberOrLen);
    this.CONSUME(RParen);
  });

  private numberOrLen = this.RULE("numberOrLen", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(KwLen);
          this.CONSUME(LParen);
          this.CONSUME(Identifier);
          this.CONSUME(RParen);
        },
      },
      { ALT: () => this.CONSUME(NumberLiteral) },
    ]);
  });

  // ── Projection ──

  private projectionDecl = this.RULE("projectionDecl", () => {
    this.CONSUME(KwProjection);
    this.SUBRULE(this.qualifiedName);
    this.CONSUME(Arrow);
    this.SUBRULE2(this.qualifiedName);
    this.CONSUME(LBrace);
    // topology = ...
    this.CONSUME(KwTopology);
    this.CONSUME(Equals);
    this.SUBRULE(this.topologyExpr);
    // optional weight_init
    this.OPTION(() => {
      this.CONSUME(KwWeightInit);
      this.CONSUME2(Equals);
      this.SUBRULE(this.weightInitExpr);
    });
    // optional rule
    this.OPTION2(() => {
      this.CONSUME(KwRule);
      this.CONSUME3(Equals);
      this.SUBRULE(this.learningRuleExpr);
    });
    this.CONSUME(RBrace);
  });

  private qualifiedName = this.RULE("qualifiedName", () => {
    this.CONSUME(Identifier);
    this.MANY(() => {
      this.CONSUME(Dot);
      this.CONSUME2(Identifier);
    });
  });

  private topologyExpr = this.RULE("topologyExpr", () => {
    this.OR([
      { ALT: () => this.CONSUME(KwDense) },
      { ALT: () => this.SUBRULE(this.sparseRandomExpr) },
      { ALT: () => this.SUBRULE(this.localExpr) },
      { ALT: () => this.CONSUME(KwLinear) },
      { ALT: () => this.SUBRULE(this.softmaxExpr) },
    ]);
  });

  private sparseRandomExpr = this.RULE("sparseRandomExpr", () => {
    this.CONSUME(KwSparseRandom);
    this.CONSUME(LParen);
    this.CONSUME(KwP);
    this.CONSUME(Equals);
    this.CONSUME(NumberLiteral);
    this.CONSUME(Comma);
    this.CONSUME(KwSeed);
    this.CONSUME2(Equals);
    this.CONSUME2(NumberLiteral);
    this.CONSUME(RParen);
  });

  private localExpr = this.RULE("localExpr", () => {
    this.CONSUME(KwLocal);
    this.CONSUME(LParen);
    this.CONSUME(KwRadius);
    this.CONSUME(Equals);
    this.CONSUME(NumberLiteral);
    this.CONSUME(RParen);
  });

  private softmaxExpr = this.RULE("softmaxExpr", () => {
    this.CONSUME(KwSoftmax);
    this.CONSUME(LParen);
    this.CONSUME(KwTemp);
    this.CONSUME(Equals);
    this.CONSUME(NumberLiteral);
    this.CONSUME(RParen);
  });

  private weightInitExpr = this.RULE("weightInitExpr", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.normalInitExpr) },
      { ALT: () => this.SUBRULE(this.uniformInitExpr) },
      { ALT: () => this.SUBRULE(this.constantInitExpr) },
    ]);
  });

  private normalInitExpr = this.RULE("normalInitExpr", () => {
    this.CONSUME(KwNormal);
    this.CONSUME(LParen);
    this.CONSUME(NumberLiteral);
    this.CONSUME(Comma);
    this.CONSUME2(NumberLiteral);
    this.CONSUME(RParen);
  });

  private uniformInitExpr = this.RULE("uniformInitExpr", () => {
    this.CONSUME(KwUniform);
    this.CONSUME(LParen);
    this.CONSUME(NumberLiteral);
    this.CONSUME(Comma);
    this.CONSUME2(NumberLiteral);
    this.CONSUME(RParen);
  });

  private constantInitExpr = this.RULE("constantInitExpr", () => {
    this.CONSUME(KwConstant);
    this.CONSUME(LParen);
    this.CONSUME(NumberLiteral);
    this.CONSUME(RParen);
  });

  private learningRuleExpr = this.RULE("learningRuleExpr", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(KwHebbian);
          this.CONSUME(LParen);
          this.CONSUME(KwTrace);
          this.CONSUME(Equals);
          this.CONSUME(TimeLiteral);
          this.CONSUME(RParen);
        },
      },
      { ALT: () => this.CONSUME(KwNone) },
    ]);
  });

  // ── Circuit ──

  private circuitDecl = this.RULE("circuitDecl", () => {
    this.CONSUME(KwCircuit);
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    // actions = [...]
    this.CONSUME(KwActions);
    this.CONSUME(Equals);
    this.CONSUME(LBracket);
    this.SUBRULE(this.identifierList);
    this.CONSUME(RBracket);
    // body: populations, projections, modulators, plasticity
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.populationDecl) },
        { ALT: () => this.SUBRULE(this.projectionDecl) },
        { ALT: () => this.SUBRULE(this.modulatorDecl) },
        { ALT: () => this.SUBRULE(this.plasticityDecl) },
      ]);
    });
    this.CONSUME(RBrace);
  });

  private plasticityDecl = this.RULE("plasticityDecl", () => {
    this.CONSUME(KwPlasticity);
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    this.CONSUME(KwRule);
    this.CONSUME(Equals);
    this.CONSUME2(Identifier);
    // optional params in parens
    this.OPTION(() => {
      this.CONSUME(LParen);
      this.MANY(() => {
        this.CONSUME3(Identifier);
        this.CONSUME2(Equals);
        this.OR([
          { ALT: () => this.CONSUME(TimeLiteral) },
          { ALT: () => this.CONSUME(NumberLiteral) },
          { ALT: () => this.CONSUME(StringLiteral) },
        ]);
        this.OPTION2(() => this.CONSUME(Comma));
      });
      this.CONSUME(RParen);
    });
    this.CONSUME(RBrace);
  });

  // ── Modulator ──

  private modulatorDecl = this.RULE("modulatorDecl", () => {
    this.CONSUME(KwModulator);
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    this.CONSUME(KwSource);
    this.CONSUME(Equals);
    this.CONSUME(KwReward);
    this.CONSUME(LParen);
    // from=Pattern, from=Pattern ...
    this.MANY(() => {
      this.CONSUME(KwFrom);
      this.CONSUME2(Equals);
      this.SUBRULE(this.sensorPattern);
      this.OPTION(() => this.CONSUME(Comma));
    });
    this.CONSUME(RParen);
    this.CONSUME(RBrace);
  });

  // ── Effector ──

  private effectorDecl = this.RULE("effectorDecl", () => {
    this.CONSUME(KwEffector);
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.bindingDecl);
    });
    this.CONSUME(RBrace);
  });

  private bindingDecl = this.RULE("bindingDecl", () => {
    this.CONSUME(KwBind);
    this.CONSUME(Identifier);
    this.CONSUME(Arrow);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(KwJs);
          this.CONSUME(LParen);
          this.CONSUME(StringLiteral);
          this.CONSUME(RParen);
        },
      },
      { ALT: () => this.CONSUME(KwNoop) },
    ]);
  });

  // ── Runtime ──

  private runtimeDecl = this.RULE("runtimeDecl", () => {
    this.CONSUME(KwRuntime);
    this.CONSUME(LBrace);
    // tick = RAF | time
    this.CONSUME(KwTick);
    this.CONSUME(Equals);
    this.OR([
      { ALT: () => this.CONSUME(KwRAF) },
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(TimeLiteral) },
    ]);
    // step { ... }
    this.CONSUME(KwStep);
    this.CONSUME2(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.stepCommand);
    });
    this.CONSUME2(RBrace);
    // guards { ... }
    this.OPTION(() => {
      this.CONSUME(KwGuards);
      this.CONSUME3(LBrace);
      this.MANY2(() => {
        this.SUBRULE(this.guardDecl);
      });
      this.CONSUME3(RBrace);
    });
    this.CONSUME(RBrace);
  });

  private stepCommand = this.RULE("stepCommand", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.ingestStep) },
      { ALT: () => this.SUBRULE(this.runStep) },
      { ALT: () => this.SUBRULE(this.emitStep) },
    ]);
  });

  private ingestStep = this.RULE("ingestStep", () => {
    this.CONSUME(KwIngest);
    this.CONSUME(LBracket);
    this.SUBRULE(this.identifierList);
    this.CONSUME(RBracket);
  });

  private runStep = this.RULE("runStep", () => {
    this.CONSUME(KwRun);
    this.SUBRULE(this.qualifiedName);
    this.OPTION(() => {
      this.CONSUME(KwDt);
      this.CONSUME(Equals);
      this.CONSUME(TimeLiteral);
    });
    this.OPTION2(() => {
      this.CONSUME(KwWhen);
      this.CONSUME2(Equals);
      this.CONSUME(Identifier);
    });
  });

  private emitStep = this.RULE("emitStep", () => {
    this.CONSUME(KwEmit);
    this.CONSUME(Identifier);
    this.CONSUME(KwFrom);
    this.CONSUME(Equals);
    this.SUBRULE(this.qualifiedName);
    this.OPTION(() => {
      this.CONSUME(KwWinnerOnly);
    });
  });

  private guardDecl = this.RULE("guardDecl", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(KwMaxEffectsPerSec);
          this.CONSUME(Equals);
          this.CONSUME(NumberLiteral);
        },
      },
      {
        ALT: () => {
          this.CONSUME(KwSuppressRepeats);
          this.CONSUME(LParen);
          this.CONSUME(KwWindow);
          this.CONSUME2(Equals);
          this.CONSUME(TimeLiteral);
          this.CONSUME(RParen);
        },
      },
      {
        ALT: () => {
          this.CONSUME(KwKeepTargetRate);
          this.CONSUME2(LParen);
          this.CONSUME(Identifier);
          this.CONSUME(Comma);
          this.CONSUME2(NumberLiteral);
          this.CONSUME2(RParen);
        },
      },
    ]);
  });

  // ── Helpers ──

  private identifierList = this.RULE("identifierList", () => {
    this.CONSUME(Identifier);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.CONSUME2(Identifier);
    });
  });
}

export const parserInstance = new BrainWebParser();
