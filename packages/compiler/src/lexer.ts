import { createToken, Lexer, ITokenConfig } from "chevrotain";

// ── Whitespace & comments (skipped) ──

export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const LineComment = createToken({
  name: "LineComment",
  pattern: /\/\/[^\n\r]*/,
  group: Lexer.SKIPPED,
});

export const BlockComment = createToken({
  name: "BlockComment",
  pattern: /\/\*[\s\S]*?\*\//,
  group: Lexer.SKIPPED,
});

// ── Symbols ──

export const Arrow = createToken({ name: "Arrow", pattern: /->/ });
export const LBrace = createToken({ name: "LBrace", pattern: /{/ });
export const RBrace = createToken({ name: "RBrace", pattern: /}/ });
export const LParen = createToken({ name: "LParen", pattern: /\(/ });
export const RParen = createToken({ name: "RParen", pattern: /\)/ });
export const LBracket = createToken({ name: "LBracket", pattern: /\[/ });
export const RBracket = createToken({ name: "RBracket", pattern: /\]/ });
export const Equals = createToken({ name: "Equals", pattern: /=/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });
export const Dot = createToken({ name: "Dot", pattern: /\./ });
export const Colon = createToken({ name: "Colon", pattern: /:/ });
export const Star = createToken({ name: "Star", pattern: /\*/ });

// ── Keywords ──

const kw = (name: string, pattern?: RegExp): ITokenConfig => ({
  name,
  pattern: pattern ?? new RegExp(name + "\\b"),
  longer_alt: undefined as any, // set below
});

export const KwApp = createToken({ name: "KwApp", pattern: /app\b/ });
export const KwSensor = createToken({ name: "KwSensor", pattern: /sensor\b/ });
export const KwEncoder = createToken({ name: "KwEncoder", pattern: /encoder\b/ });
export const KwRegion = createToken({ name: "KwRegion", pattern: /region\b/ });
export const KwPopulation = createToken({ name: "KwPopulation", pattern: /population\b/ });
export const KwProjection = createToken({ name: "KwProjection", pattern: /projection\b/ });
export const KwCircuit = createToken({ name: "KwCircuit", pattern: /circuit\b/ });
export const KwModulator = createToken({ name: "KwModulator", pattern: /modulator\b/ });
export const KwEffector = createToken({ name: "KwEffector", pattern: /effector\b/ });
export const KwRuntime = createToken({ name: "KwRuntime", pattern: /runtime\b/ });
export const KwIngest = createToken({ name: "KwIngest", pattern: /ingest\b/ });
export const KwRun = createToken({ name: "KwRun", pattern: /run\b/ });
export const KwEmit = createToken({ name: "KwEmit", pattern: /emit\b/ });
export const KwBind = createToken({ name: "KwBind", pattern: /bind\b/ });
export const KwJs = createToken({ name: "KwJs", pattern: /js\b/ });
export const KwNoop = createToken({ name: "KwNoop", pattern: /noop\b/ });
export const KwEvents = createToken({ name: "KwEvents", pattern: /events\b/ });
export const KwFeatureVector = createToken({ name: "KwFeatureVector", pattern: /FeatureVector\b/ });
export const KwDim = createToken({ name: "KwDim", pattern: /dim\b/ });
export const KwPolicy = createToken({ name: "KwPolicy", pattern: /policy\b/ });
export const KwTopology = createToken({ name: "KwTopology", pattern: /topology\b/ });
export const KwWeightInit = createToken({ name: "KwWeightInit", pattern: /weight_init\b/ });
export const KwRule = createToken({ name: "KwRule", pattern: /rule\b/ });
export const KwActions = createToken({ name: "KwActions", pattern: /actions\b/ });
export const KwGuards = createToken({ name: "KwGuards", pattern: /guards\b/ });
export const KwTick = createToken({ name: "KwTick", pattern: /tick\b/ });
export const KwDt = createToken({ name: "KwDt", pattern: /dt\b/ });
export const KwWhen = createToken({ name: "KwWhen", pattern: /when\b/ });
export const KwFrom = createToken({ name: "KwFrom", pattern: /from\b/ });
export const KwWinnerOnly = createToken({ name: "KwWinnerOnly", pattern: /winner_only\b/ });
export const KwStep = createToken({ name: "KwStep", pattern: /step\b/ });
export const KwIn = createToken({ name: "KwIn", pattern: /in\b/ });
export const KwOut = createToken({ name: "KwOut", pattern: /out\b/ });
export const KwSlots = createToken({ name: "KwSlots", pattern: /slots\b/ });
export const KwDecay = createToken({ name: "KwDecay", pattern: /decay\b/ });
export const KwMerge = createToken({ name: "KwMerge", pattern: /merge\b/ });
export const KwNeurons = createToken({ name: "KwNeurons", pattern: /neurons\b/ });
export const KwNeuron = createToken({ name: "KwNeuron", pattern: /neuron\b/ });
export const KwTargetRate = createToken({ name: "KwTargetRate", pattern: /target_rate\b/ });
export const KwInhibition = createToken({ name: "KwInhibition", pattern: /inhibition\b/ });
export const KwUnits = createToken({ name: "KwUnits", pattern: /units\b/ });
export const KwLen = createToken({ name: "KwLen", pattern: /len\b/ });
export const KwMaxEffectsPerSec = createToken({ name: "KwMaxEffectsPerSec", pattern: /max_effects_per_sec\b/ });
export const KwSuppressRepeats = createToken({ name: "KwSuppressRepeats", pattern: /suppress_repeats\b/ });
export const KwWindow = createToken({ name: "KwWindow", pattern: /window\b/ });
export const KwKeepTargetRate = createToken({ name: "KwKeepTargetRate", pattern: /keep_target_rate\b/ });
export const KwWinnerTakeAll = createToken({ name: "KwWinnerTakeAll", pattern: /winner_take_all\b/ });
export const KwSoftmax = createToken({ name: "KwSoftmax", pattern: /softmax\b/ });
export const KwTemp = createToken({ name: "KwTemp", pattern: /temp\b/ });
export const KwRAF = createToken({ name: "KwRAF", pattern: /RAF\b/ });
export const KwState = createToken({ name: "KwState", pattern: /state\b/ });
export const KwSpiking = createToken({ name: "KwSpiking", pattern: /spiking\b/ });
export const KwRecurrent = createToken({ name: "KwRecurrent", pattern: /recurrent\b/ });
export const KwRate = createToken({ name: "KwRate", pattern: /rate\b/ });
export const KwLIF = createToken({ name: "KwLIF", pattern: /LIF\b/ });
export const KwTau = createToken({ name: "KwTau", pattern: /tau\b/ });
export const KwRefr = createToken({ name: "KwRefr", pattern: /refr\b/ });
export const KwSource = createToken({ name: "KwSource", pattern: /source\b/ });
export const KwReward = createToken({ name: "KwReward", pattern: /reward\b/ });
export const KwPlasticity = createToken({ name: "KwPlasticity", pattern: /plasticity\b/ });
export const KwDense = createToken({ name: "KwDense", pattern: /dense\b/ });
export const KwSparseRandom = createToken({ name: "KwSparseRandom", pattern: /sparse_random\b/ });
export const KwLocal = createToken({ name: "KwLocal", pattern: /local\b/ });
export const KwLinear = createToken({ name: "KwLinear", pattern: /linear\b/ });
export const KwNormal = createToken({ name: "KwNormal", pattern: /normal\b/ });
export const KwUniform = createToken({ name: "KwUniform", pattern: /uniform\b/ });
export const KwConstant = createToken({ name: "KwConstant", pattern: /constant\b/ });
export const KwHebbian = createToken({ name: "KwHebbian", pattern: /hebbian\b/ });
export const KwNone = createToken({ name: "KwNone", pattern: /none\b/ });
export const KwTrace = createToken({ name: "KwTrace", pattern: /trace\b/ });
export const KwOnehot = createToken({ name: "KwOnehot", pattern: /onehot\b/ });
export const KwBucket = createToken({ name: "KwBucket", pattern: /bucket\b/ });
export const KwHash = createToken({ name: "KwHash", pattern: /hash\b/ });
export const KwNumeric = createToken({ name: "KwNumeric", pattern: /numeric\b/ });
export const KwClamp = createToken({ name: "KwClamp", pattern: /clamp\b/ });
export const KwScale = createToken({ name: "KwScale", pattern: /scale\b/ });
export const KwP = createToken({ name: "KwP", pattern: /p\b/ });
export const KwSeed = createToken({ name: "KwSeed", pattern: /seed\b/ });
export const KwRadius = createToken({ name: "KwRadius", pattern: /radius\b/ });
export const KwMu = createToken({ name: "KwMu", pattern: /mu\b/ });
export const KwSigma = createToken({ name: "KwSigma", pattern: /sigma\b/ });
export const KwA = createToken({ name: "KwA", pattern: /a\b/ });
export const KwB = createToken({ name: "KwB", pattern: /b\b/ });
export const KwC = createToken({ name: "KwC", pattern: /c\b/ });
export const KwMin = createToken({ name: "KwMin", pattern: /min\b/ });
export const KwMax = createToken({ name: "KwMax", pattern: /max\b/ });
export const KwFactor = createToken({ name: "KwFactor", pattern: /factor\b/ });
export const KwRewardHebbian = createToken({ name: "KwRewardHebbian", pattern: /reward_hebbian\b/ });

// ── Literals ──

export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"(?:[^"\\]|\\.)*"/,
});

// TimeLiteral must come before NumberLiteral
export const TimeLiteral = createToken({
  name: "TimeLiteral",
  pattern: /\d+(\.\d+)?(ms|s|m)\b/,
});

export const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /\d+(\.\d+)?/,
});

// ── Identifier (must be after all keywords) ──

export const Identifier = createToken({
  name: "Identifier",
  pattern: /[A-Za-z_][A-Za-z0-9_]*/,
});

// Set longer_alt for all keywords so Identifier doesn't consume them
const allKeywords = [
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
];

for (const kwToken of allKeywords) {
  (kwToken as any).LONGER_ALT = Identifier;
}

// Token ordering matters: keywords before Identifier, TimeLiteral before NumberLiteral
export const allTokens = [
  // Skipped
  WhiteSpace,
  LineComment,
  BlockComment,
  // Symbols (Arrow before Dot so -> isn't misread)
  Arrow,
  LBrace, RBrace,
  LParen, RParen,
  LBracket, RBracket,
  Equals,
  Comma,
  Dot,
  Colon,
  Star,
  // String
  StringLiteral,
  // Time (before number)
  TimeLiteral,
  // Number
  NumberLiteral,
  // Keywords (before identifier)
  ...allKeywords,
  // General identifier
  Identifier,
];

export const BrainWebLexer = new Lexer(allTokens, { ensureOptimizations: true });
