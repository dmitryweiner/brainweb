"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJS = exports.lower = exports.validate = exports.visitorInstance = exports.parserInstance = exports.BrainWebParser = exports.allTokens = exports.BrainWebLexer = void 0;
exports.compile = compile;
var lexer_1 = require("./lexer");
Object.defineProperty(exports, "BrainWebLexer", { enumerable: true, get: function () { return lexer_1.BrainWebLexer; } });
Object.defineProperty(exports, "allTokens", { enumerable: true, get: function () { return lexer_1.allTokens; } });
var parser_1 = require("./parser");
Object.defineProperty(exports, "BrainWebParser", { enumerable: true, get: function () { return parser_1.BrainWebParser; } });
Object.defineProperty(exports, "parserInstance", { enumerable: true, get: function () { return parser_1.parserInstance; } });
var visitor_1 = require("./visitor");
Object.defineProperty(exports, "visitorInstance", { enumerable: true, get: function () { return visitor_1.visitorInstance; } });
var validate_1 = require("./validate");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validate_1.validate; } });
var lower_1 = require("./lower");
Object.defineProperty(exports, "lower", { enumerable: true, get: function () { return lower_1.lower; } });
var codegen_1 = require("./codegen");
Object.defineProperty(exports, "generateJS", { enumerable: true, get: function () { return codegen_1.generateJS; } });
__exportStar(require("./ir"), exports);
__exportStar(require("./ast"), exports);
const lexer_2 = require("./lexer");
const parser_2 = require("./parser");
const visitor_2 = require("./visitor");
const validate_2 = require("./validate");
const lower_2 = require("./lower");
const codegen_2 = require("./codegen");
function compile(source) {
    // Lex
    const lexResult = lexer_2.BrainWebLexer.tokenize(source);
    if (lexResult.errors.length > 0) {
        const msgs = lexResult.errors.map(e => `Lex error at ${e.line}:${e.column}: ${e.message}`);
        throw new Error(msgs.join("\n"));
    }
    // Parse
    parser_2.parserInstance.input = lexResult.tokens;
    const cst = parser_2.parserInstance.program();
    if (parser_2.parserInstance.errors.length > 0) {
        const msgs = parser_2.parserInstance.errors.map(e => e.message);
        throw new Error("Parse errors:\n" + msgs.join("\n"));
    }
    // CST -> AST
    const ast = visitor_2.visitorInstance.visit(cst);
    // Validate
    const diagnostics = (0, validate_2.validate)(ast);
    const errors = diagnostics.filter(d => d.level === "error");
    if (errors.length > 0) {
        const msgs = errors.map(d => `${d.line ?? "?"}:${d.column ?? "?"}: ${d.message}`);
        throw new Error("Validation errors:\n" + msgs.join("\n"));
    }
    // Lower
    const ir = (0, lower_2.lower)(ast);
    // Codegen
    const js = (0, codegen_2.generateJS)(ir);
    const graphJson = JSON.stringify(ir, null, 2);
    return { ast, ir, js, graphJson, diagnostics };
}
//# sourceMappingURL=index.js.map