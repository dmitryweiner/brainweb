export { BrainWebLexer, allTokens } from "./lexer";
export { BrainWebParser, parserInstance } from "./parser";
export { visitorInstance } from "./visitor";
export { validate, Diagnostic, SymbolTable } from "./validate";
export { lower } from "./lower";
export { generateJS } from "./codegen";
export * from "./ir";
export * from "./ast";

import { BrainWebLexer } from "./lexer";
import { parserInstance } from "./parser";
import { visitorInstance } from "./visitor";
import { validate } from "./validate";
import { lower } from "./lower";
import { generateJS } from "./codegen";
import { AppNode } from "./ast";
import { AppIR } from "./ir";

export interface CompileResult {
  ast: AppNode;
  ir: AppIR;
  js: string;
  graphJson: string;
  diagnostics: import("./validate").Diagnostic[];
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
