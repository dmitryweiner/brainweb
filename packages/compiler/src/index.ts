export { BrainWebLexer, allTokens } from "./lexer.js";
export { BrainWebParser, parserInstance } from "./parser.js";
export { visitorInstance } from "./visitor.js";
export { validate, Diagnostic, SymbolTable } from "./validate.js";
export { lower } from "./lower.js";
export { generateJS } from "./codegen.js";
export * from "./ir.js";
export * from "./ast.js";

import { BrainWebLexer } from "./lexer.js";
import { parserInstance } from "./parser.js";
import { visitorInstance } from "./visitor.js";
import { validate } from "./validate.js";
import { lower } from "./lower.js";
import { generateJS } from "./codegen.js";
import { AppNode } from "./ast.js";
import { AppIR } from "./ir.js";

export interface CompileResult {
  ast: AppNode;
  ir: AppIR;
  js: string;
  graphJson: string;
  diagnostics: import("./validate.js").Diagnostic[];
}

export function compile(source: string): CompileResult {
  // Lex
  const lexResult = BrainWebLexer.tokenize(source);
  if (lexResult.errors.length > 0) {
    const msgs = lexResult.errors.map(e => `Lex error at ${e.line}:${e.column}: ${e.message}`);
    throw new Error(msgs.join("\n"));
  }

  // Parse
  parserInstance.input = lexResult.tokens;
  const cst = parserInstance.program();
  if (parserInstance.errors.length > 0) {
    const msgs = parserInstance.errors.map(e => e.message);
    throw new Error("Parse errors:\n" + msgs.join("\n"));
  }

  // CST -> AST
  const ast: AppNode = visitorInstance.visit(cst);

  // Validate
  const diagnostics = validate(ast);
  const errors = diagnostics.filter(d => d.level === "error");
  if (errors.length > 0) {
    const msgs = errors.map(d => `${d.line ?? "?"}:${d.column ?? "?"}: ${d.message}`);
    throw new Error("Validation errors:\n" + msgs.join("\n"));
  }

  // Lower
  const ir = lower(ast);

  // Codegen
  const js = generateJS(ir);
  const graphJson = JSON.stringify(ir, null, 2);

  return { ast, ir, js, graphJson, diagnostics };
}
