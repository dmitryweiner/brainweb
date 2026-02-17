export { BrainWebLexer, allTokens } from "./lexer";
export { BrainWebParser, parserInstance } from "./parser";
export { visitorInstance } from "./visitor";
export { validate, Diagnostic, SymbolTable } from "./validate";
export { lower } from "./lower";
export { generateJS } from "./codegen";
export * from "./ir";
export * from "./ast";
import { AppNode } from "./ast";
import { AppIR } from "./ir";
export interface CompileResult {
    ast: AppNode;
    ir: AppIR;
    js: string;
    graphJson: string;
    diagnostics: import("./validate").Diagnostic[];
}
export declare function compile(source: string): CompileResult;
//# sourceMappingURL=index.d.ts.map