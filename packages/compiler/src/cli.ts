#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { compile } from "./index";

function main(): void {
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
    const result = compile(source);

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
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
