#!/usr/bin/env node
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const index_1 = require("./index");
function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        console.log("Usage: brainwebc <file.brainweb> [--out <dir>]");
        console.log("");
        console.log("Options:");
        console.log("  --out <dir>   Output directory (default: dist/)");
        console.log("  --help        Show this help");
        process.exit(0);
    }
    const inputFile = args[0];
    let outDir = "dist";
    const outIdx = args.indexOf("--out");
    if (outIdx !== -1 && args[outIdx + 1]) {
        outDir = args[outIdx + 1];
    }
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: File not found: ${inputFile}`);
        process.exit(1);
    }
    const source = fs.readFileSync(inputFile, "utf-8");
    try {
        const result = (0, index_1.compile)(source);
        // Print warnings
        for (const d of result.diagnostics) {
            if (d.level === "warning") {
                console.warn(`Warning: ${d.message}`);
            }
        }
        // Ensure output directory exists
        fs.mkdirSync(outDir, { recursive: true });
        // Write files
        const jsPath = path.join(outDir, "app.runtime.js");
        const jsonPath = path.join(outDir, "app.graph.json");
        fs.writeFileSync(jsPath, result.js, "utf-8");
        fs.writeFileSync(jsonPath, result.graphJson, "utf-8");
        console.log(`Compiled ${inputFile} -> ${jsPath}`);
        console.log(`IR graph -> ${jsonPath}`);
        console.log(`App: ${result.ir.name}`);
        console.log(`  Sensors: ${result.ir.sensors.map(s => s.name).join(", ")}`);
        console.log(`  Encoders: ${result.ir.encoders.map(e => e.name).join(", ")}`);
        console.log(`  Modules: ${result.ir.modules.map(m => m.name).join(", ")}`);
        console.log(`  Effectors: ${result.ir.effectors.map(e => e.name).join(", ")}`);
    }
    catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=cli.js.map