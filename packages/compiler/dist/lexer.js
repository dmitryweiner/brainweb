"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KwDecay = exports.KwSlots = exports.KwOut = exports.KwIn = exports.KwStep = exports.KwWinnerOnly = exports.KwFrom = exports.KwWhen = exports.KwDt = exports.KwTick = exports.KwGuards = exports.KwActions = exports.KwRule = exports.KwWeightInit = exports.KwTopology = exports.KwPolicy = exports.KwDim = exports.KwFeatureVector = exports.KwEvents = exports.KwNoop = exports.KwJs = exports.KwBind = exports.KwEmit = exports.KwRun = exports.KwIngest = exports.KwRuntime = exports.KwEffector = exports.KwModulator = exports.KwCircuit = exports.KwProjection = exports.KwPopulation = exports.KwRegion = exports.KwEncoder = exports.KwSensor = exports.KwApp = exports.Star = exports.Colon = exports.Dot = exports.Comma = exports.Equals = exports.RBracket = exports.LBracket = exports.RParen = exports.LParen = exports.RBrace = exports.LBrace = exports.Arrow = exports.BlockComment = exports.LineComment = exports.WhiteSpace = void 0;
exports.KwMin = exports.KwC = exports.KwB = exports.KwA = exports.KwSigma = exports.KwMu = exports.KwRadius = exports.KwSeed = exports.KwP = exports.KwScale = exports.KwClamp = exports.KwNumeric = exports.KwHash = exports.KwBucket = exports.KwOnehot = exports.KwTrace = exports.KwNone = exports.KwHebbian = exports.KwConstant = exports.KwUniform = exports.KwNormal = exports.KwLinear = exports.KwLocal = exports.KwSparseRandom = exports.KwDense = exports.KwPlasticity = exports.KwReward = exports.KwSource = exports.KwRefr = exports.KwTau = exports.KwLIF = exports.KwRate = exports.KwRecurrent = exports.KwSpiking = exports.KwState = exports.KwRAF = exports.KwTemp = exports.KwSoftmax = exports.KwWinnerTakeAll = exports.KwKeepTargetRate = exports.KwWindow = exports.KwSuppressRepeats = exports.KwMaxEffectsPerSec = exports.KwLen = exports.KwUnits = exports.KwInhibition = exports.KwTargetRate = exports.KwNeuron = exports.KwNeurons = exports.KwMerge = void 0;
exports.BrainWebLexer = exports.allTokens = exports.Identifier = exports.NumberLiteral = exports.TimeLiteral = exports.StringLiteral = exports.KwRewardHebbian = exports.KwFactor = exports.KwMax = void 0;
const chevrotain_1 = require("chevrotain");
// ── Whitespace & comments (skipped) ──
exports.WhiteSpace = (0, chevrotain_1.createToken)({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: chevrotain_1.Lexer.SKIPPED,
});
exports.LineComment = (0, chevrotain_1.createToken)({
    name: "LineComment",
    pattern: /\/\/[^\n\r]*/,
    group: chevrotain_1.Lexer.SKIPPED,
});
exports.BlockComment = (0, chevrotain_1.createToken)({
    name: "BlockComment",
    pattern: /\/\*[\s\S]*?\*\//,
    group: chevrotain_1.Lexer.SKIPPED,
});
// ── Symbols ──
exports.Arrow = (0, chevrotain_1.createToken)({ name: "Arrow", pattern: /->/ });
exports.LBrace = (0, chevrotain_1.createToken)({ name: "LBrace", pattern: /{/ });
exports.RBrace = (0, chevrotain_1.createToken)({ name: "RBrace", pattern: /}/ });
exports.LParen = (0, chevrotain_1.createToken)({ name: "LParen", pattern: /\(/ });
exports.RParen = (0, chevrotain_1.createToken)({ name: "RParen", pattern: /\)/ });
exports.LBracket = (0, chevrotain_1.createToken)({ name: "LBracket", pattern: /\[/ });
exports.RBracket = (0, chevrotain_1.createToken)({ name: "RBracket", pattern: /\]/ });
exports.Equals = (0, chevrotain_1.createToken)({ name: "Equals", pattern: /=/ });
exports.Comma = (0, chevrotain_1.createToken)({ name: "Comma", pattern: /,/ });
exports.Dot = (0, chevrotain_1.createToken)({ name: "Dot", pattern: /\./ });
exports.Colon = (0, chevrotain_1.createToken)({ name: "Colon", pattern: /:/ });
exports.Star = (0, chevrotain_1.createToken)({ name: "Star", pattern: /\*/ });
// ── Keywords ──
const kw = (name, pattern) => ({
    name,
    pattern: pattern ?? new RegExp(name + "\\b"),
    longer_alt: undefined, // set below
});
exports.KwApp = (0, chevrotain_1.createToken)({ name: "KwApp", pattern: /app\b/ });
exports.KwSensor = (0, chevrotain_1.createToken)({ name: "KwSensor", pattern: /sensor\b/ });
exports.KwEncoder = (0, chevrotain_1.createToken)({ name: "KwEncoder", pattern: /encoder\b/ });
exports.KwRegion = (0, chevrotain_1.createToken)({ name: "KwRegion", pattern: /region\b/ });
exports.KwPopulation = (0, chevrotain_1.createToken)({ name: "KwPopulation", pattern: /population\b/ });
exports.KwProjection = (0, chevrotain_1.createToken)({ name: "KwProjection", pattern: /projection\b/ });
exports.KwCircuit = (0, chevrotain_1.createToken)({ name: "KwCircuit", pattern: /circuit\b/ });
exports.KwModulator = (0, chevrotain_1.createToken)({ name: "KwModulator", pattern: /modulator\b/ });
exports.KwEffector = (0, chevrotain_1.createToken)({ name: "KwEffector", pattern: /effector\b/ });
exports.KwRuntime = (0, chevrotain_1.createToken)({ name: "KwRuntime", pattern: /runtime\b/ });
exports.KwIngest = (0, chevrotain_1.createToken)({ name: "KwIngest", pattern: /ingest\b/ });
exports.KwRun = (0, chevrotain_1.createToken)({ name: "KwRun", pattern: /run\b/ });
exports.KwEmit = (0, chevrotain_1.createToken)({ name: "KwEmit", pattern: /emit\b/ });
exports.KwBind = (0, chevrotain_1.createToken)({ name: "KwBind", pattern: /bind\b/ });
exports.KwJs = (0, chevrotain_1.createToken)({ name: "KwJs", pattern: /js\b/ });
exports.KwNoop = (0, chevrotain_1.createToken)({ name: "KwNoop", pattern: /noop\b/ });
exports.KwEvents = (0, chevrotain_1.createToken)({ name: "KwEvents", pattern: /events\b/ });
exports.KwFeatureVector = (0, chevrotain_1.createToken)({ name: "KwFeatureVector", pattern: /FeatureVector\b/ });
exports.KwDim = (0, chevrotain_1.createToken)({ name: "KwDim", pattern: /dim\b/ });
exports.KwPolicy = (0, chevrotain_1.createToken)({ name: "KwPolicy", pattern: /policy\b/ });
exports.KwTopology = (0, chevrotain_1.createToken)({ name: "KwTopology", pattern: /topology\b/ });
exports.KwWeightInit = (0, chevrotain_1.createToken)({ name: "KwWeightInit", pattern: /weight_init\b/ });
exports.KwRule = (0, chevrotain_1.createToken)({ name: "KwRule", pattern: /rule\b/ });
exports.KwActions = (0, chevrotain_1.createToken)({ name: "KwActions", pattern: /actions\b/ });
exports.KwGuards = (0, chevrotain_1.createToken)({ name: "KwGuards", pattern: /guards\b/ });
exports.KwTick = (0, chevrotain_1.createToken)({ name: "KwTick", pattern: /tick\b/ });
exports.KwDt = (0, chevrotain_1.createToken)({ name: "KwDt", pattern: /dt\b/ });
exports.KwWhen = (0, chevrotain_1.createToken)({ name: "KwWhen", pattern: /when\b/ });
exports.KwFrom = (0, chevrotain_1.createToken)({ name: "KwFrom", pattern: /from\b/ });
exports.KwWinnerOnly = (0, chevrotain_1.createToken)({ name: "KwWinnerOnly", pattern: /winner_only\b/ });
exports.KwStep = (0, chevrotain_1.createToken)({ name: "KwStep", pattern: /step\b/ });
exports.KwIn = (0, chevrotain_1.createToken)({ name: "KwIn", pattern: /in\b/ });
exports.KwOut = (0, chevrotain_1.createToken)({ name: "KwOut", pattern: /out\b/ });
exports.KwSlots = (0, chevrotain_1.createToken)({ name: "KwSlots", pattern: /slots\b/ });
exports.KwDecay = (0, chevrotain_1.createToken)({ name: "KwDecay", pattern: /decay\b/ });
exports.KwMerge = (0, chevrotain_1.createToken)({ name: "KwMerge", pattern: /merge\b/ });
exports.KwNeurons = (0, chevrotain_1.createToken)({ name: "KwNeurons", pattern: /neurons\b/ });
exports.KwNeuron = (0, chevrotain_1.createToken)({ name: "KwNeuron", pattern: /neuron\b/ });
exports.KwTargetRate = (0, chevrotain_1.createToken)({ name: "KwTargetRate", pattern: /target_rate\b/ });
exports.KwInhibition = (0, chevrotain_1.createToken)({ name: "KwInhibition", pattern: /inhibition\b/ });
exports.KwUnits = (0, chevrotain_1.createToken)({ name: "KwUnits", pattern: /units\b/ });
exports.KwLen = (0, chevrotain_1.createToken)({ name: "KwLen", pattern: /len\b/ });
exports.KwMaxEffectsPerSec = (0, chevrotain_1.createToken)({ name: "KwMaxEffectsPerSec", pattern: /max_effects_per_sec\b/ });
exports.KwSuppressRepeats = (0, chevrotain_1.createToken)({ name: "KwSuppressRepeats", pattern: /suppress_repeats\b/ });
exports.KwWindow = (0, chevrotain_1.createToken)({ name: "KwWindow", pattern: /window\b/ });
exports.KwKeepTargetRate = (0, chevrotain_1.createToken)({ name: "KwKeepTargetRate", pattern: /keep_target_rate\b/ });
exports.KwWinnerTakeAll = (0, chevrotain_1.createToken)({ name: "KwWinnerTakeAll", pattern: /winner_take_all\b/ });
exports.KwSoftmax = (0, chevrotain_1.createToken)({ name: "KwSoftmax", pattern: /softmax\b/ });
exports.KwTemp = (0, chevrotain_1.createToken)({ name: "KwTemp", pattern: /temp\b/ });
exports.KwRAF = (0, chevrotain_1.createToken)({ name: "KwRAF", pattern: /RAF\b/ });
exports.KwState = (0, chevrotain_1.createToken)({ name: "KwState", pattern: /state\b/ });
exports.KwSpiking = (0, chevrotain_1.createToken)({ name: "KwSpiking", pattern: /spiking\b/ });
exports.KwRecurrent = (0, chevrotain_1.createToken)({ name: "KwRecurrent", pattern: /recurrent\b/ });
exports.KwRate = (0, chevrotain_1.createToken)({ name: "KwRate", pattern: /rate\b/ });
exports.KwLIF = (0, chevrotain_1.createToken)({ name: "KwLIF", pattern: /LIF\b/ });
exports.KwTau = (0, chevrotain_1.createToken)({ name: "KwTau", pattern: /tau\b/ });
exports.KwRefr = (0, chevrotain_1.createToken)({ name: "KwRefr", pattern: /refr\b/ });
exports.KwSource = (0, chevrotain_1.createToken)({ name: "KwSource", pattern: /source\b/ });
exports.KwReward = (0, chevrotain_1.createToken)({ name: "KwReward", pattern: /reward\b/ });
exports.KwPlasticity = (0, chevrotain_1.createToken)({ name: "KwPlasticity", pattern: /plasticity\b/ });
exports.KwDense = (0, chevrotain_1.createToken)({ name: "KwDense", pattern: /dense\b/ });
exports.KwSparseRandom = (0, chevrotain_1.createToken)({ name: "KwSparseRandom", pattern: /sparse_random\b/ });
exports.KwLocal = (0, chevrotain_1.createToken)({ name: "KwLocal", pattern: /local\b/ });
exports.KwLinear = (0, chevrotain_1.createToken)({ name: "KwLinear", pattern: /linear\b/ });
exports.KwNormal = (0, chevrotain_1.createToken)({ name: "KwNormal", pattern: /normal\b/ });
exports.KwUniform = (0, chevrotain_1.createToken)({ name: "KwUniform", pattern: /uniform\b/ });
exports.KwConstant = (0, chevrotain_1.createToken)({ name: "KwConstant", pattern: /constant\b/ });
exports.KwHebbian = (0, chevrotain_1.createToken)({ name: "KwHebbian", pattern: /hebbian\b/ });
exports.KwNone = (0, chevrotain_1.createToken)({ name: "KwNone", pattern: /none\b/ });
exports.KwTrace = (0, chevrotain_1.createToken)({ name: "KwTrace", pattern: /trace\b/ });
exports.KwOnehot = (0, chevrotain_1.createToken)({ name: "KwOnehot", pattern: /onehot\b/ });
exports.KwBucket = (0, chevrotain_1.createToken)({ name: "KwBucket", pattern: /bucket\b/ });
exports.KwHash = (0, chevrotain_1.createToken)({ name: "KwHash", pattern: /hash\b/ });
exports.KwNumeric = (0, chevrotain_1.createToken)({ name: "KwNumeric", pattern: /numeric\b/ });
exports.KwClamp = (0, chevrotain_1.createToken)({ name: "KwClamp", pattern: /clamp\b/ });
exports.KwScale = (0, chevrotain_1.createToken)({ name: "KwScale", pattern: /scale\b/ });
exports.KwP = (0, chevrotain_1.createToken)({ name: "KwP", pattern: /p\b/ });
exports.KwSeed = (0, chevrotain_1.createToken)({ name: "KwSeed", pattern: /seed\b/ });
exports.KwRadius = (0, chevrotain_1.createToken)({ name: "KwRadius", pattern: /radius\b/ });
exports.KwMu = (0, chevrotain_1.createToken)({ name: "KwMu", pattern: /mu\b/ });
exports.KwSigma = (0, chevrotain_1.createToken)({ name: "KwSigma", pattern: /sigma\b/ });
exports.KwA = (0, chevrotain_1.createToken)({ name: "KwA", pattern: /a\b/ });
exports.KwB = (0, chevrotain_1.createToken)({ name: "KwB", pattern: /b\b/ });
exports.KwC = (0, chevrotain_1.createToken)({ name: "KwC", pattern: /c\b/ });
exports.KwMin = (0, chevrotain_1.createToken)({ name: "KwMin", pattern: /min\b/ });
exports.KwMax = (0, chevrotain_1.createToken)({ name: "KwMax", pattern: /max\b/ });
exports.KwFactor = (0, chevrotain_1.createToken)({ name: "KwFactor", pattern: /factor\b/ });
exports.KwRewardHebbian = (0, chevrotain_1.createToken)({ name: "KwRewardHebbian", pattern: /reward_hebbian\b/ });
// ── Literals ──
exports.StringLiteral = (0, chevrotain_1.createToken)({
    name: "StringLiteral",
    pattern: /"(?:[^"\\]|\\.)*"/,
});
// TimeLiteral must come before NumberLiteral
exports.TimeLiteral = (0, chevrotain_1.createToken)({
    name: "TimeLiteral",
    pattern: /\d+(\.\d+)?(ms|s|m)\b/,
});
exports.NumberLiteral = (0, chevrotain_1.createToken)({
    name: "NumberLiteral",
    pattern: /\d+(\.\d+)?/,
});
// ── Identifier (must be after all keywords) ──
exports.Identifier = (0, chevrotain_1.createToken)({
    name: "Identifier",
    pattern: /[A-Za-z_][A-Za-z0-9_]*/,
});
// Set longer_alt for all keywords so Identifier doesn't consume them
const allKeywords = [
    exports.KwApp, exports.KwSensor, exports.KwEncoder, exports.KwRegion, exports.KwPopulation, exports.KwProjection,
    exports.KwCircuit, exports.KwModulator, exports.KwEffector, exports.KwRuntime, exports.KwIngest, exports.KwRun,
    exports.KwEmit, exports.KwBind, exports.KwJs, exports.KwNoop, exports.KwEvents, exports.KwFeatureVector, exports.KwDim,
    exports.KwPolicy, exports.KwTopology, exports.KwWeightInit, exports.KwRule, exports.KwActions, exports.KwGuards,
    exports.KwTick, exports.KwDt, exports.KwWhen, exports.KwFrom, exports.KwWinnerOnly, exports.KwStep, exports.KwIn, exports.KwOut,
    exports.KwSlots, exports.KwDecay, exports.KwMerge, exports.KwNeurons, exports.KwNeuron, exports.KwTargetRate,
    exports.KwInhibition, exports.KwUnits, exports.KwLen, exports.KwMaxEffectsPerSec, exports.KwSuppressRepeats,
    exports.KwWindow, exports.KwKeepTargetRate, exports.KwWinnerTakeAll, exports.KwSoftmax, exports.KwTemp,
    exports.KwRAF, exports.KwState, exports.KwSpiking, exports.KwRecurrent, exports.KwRate, exports.KwLIF, exports.KwTau,
    exports.KwRefr, exports.KwSource, exports.KwReward, exports.KwPlasticity, exports.KwDense, exports.KwSparseRandom,
    exports.KwLocal, exports.KwLinear, exports.KwNormal, exports.KwUniform, exports.KwConstant, exports.KwHebbian,
    exports.KwNone, exports.KwTrace, exports.KwOnehot, exports.KwBucket, exports.KwHash, exports.KwNumeric, exports.KwClamp,
    exports.KwScale, exports.KwP, exports.KwSeed, exports.KwRadius, exports.KwMu, exports.KwSigma, exports.KwA, exports.KwB, exports.KwC,
    exports.KwMin, exports.KwMax, exports.KwFactor, exports.KwRewardHebbian,
];
for (const kwToken of allKeywords) {
    kwToken.LONGER_ALT = exports.Identifier;
}
// Token ordering matters: keywords before Identifier, TimeLiteral before NumberLiteral
exports.allTokens = [
    // Skipped
    exports.WhiteSpace,
    exports.LineComment,
    exports.BlockComment,
    // Symbols (Arrow before Dot so -> isn't misread)
    exports.Arrow,
    exports.LBrace, exports.RBrace,
    exports.LParen, exports.RParen,
    exports.LBracket, exports.RBracket,
    exports.Equals,
    exports.Comma,
    exports.Dot,
    exports.Colon,
    exports.Star,
    // String
    exports.StringLiteral,
    // Time (before number)
    exports.TimeLiteral,
    // Number
    exports.NumberLiteral,
    // Keywords (before identifier)
    ...allKeywords,
    // General identifier
    exports.Identifier,
];
exports.BrainWebLexer = new chevrotain_1.Lexer(exports.allTokens, { ensureOptimizations: true });
//# sourceMappingURL=lexer.js.map