import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { compile } from "../src/index";

const FIXTURES = path.join(__dirname, "fixtures");

describe("BrainWeb Compiler", () => {
  it("compiles the minimal fixture without errors", () => {
    const source = fs.readFileSync(path.join(FIXTURES, "minimal.brainweb"), "utf-8");
    const result = compile(source);

    expect(result.ast.kind).toBe("App");
    expect(result.ast.name).toBe("MinimalTest");

    expect(result.ir.name).toBe("MinimalTest");
    expect(result.ir.sensors).toHaveLength(1);
    expect(result.ir.sensors[0].name).toBe("UI");
    expect(result.ir.encoders).toHaveLength(1);
    expect(result.ir.encoders[0].dim).toBe(16);
    expect(result.ir.effectors).toHaveLength(1);
    expect(result.ir.effectors[0].bindings).toHaveLength(2);

    // Generated JS should be valid
    expect(result.js).toContain("createApp");
    expect(result.js).toContain("BrainWeb");

    // No errors
    const errors = result.diagnostics.filter(d => d.level === "error");
    expect(errors).toHaveLength(0);
  });

  it("compiles the demo fixture", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../../..", "demo", "demo.brainweb"),
      "utf-8"
    );
    const result = compile(source);

    expect(result.ast.name).toBe("ClickDemo");
    expect(result.ir.sensors[0].eventTypes).toContain("Click");
    expect(result.ir.sensors[0].eventTypes).toContain("Input");
    expect(result.ir.sensors[0].eventTypes).toContain("KeyDown");

    // Should have action selector with 3 actions
    const actionSel = result.ir.modules.find(m => m.kind === "ActionSelector");
    expect(actionSel).toBeDefined();
    if (actionSel && actionSel.kind === "ActionSelector") {
      expect(actionSel.actions).toEqual(["ShowToast", "HighlightTarget", "Ignore"]);
    }
  });

  it("rejects unsafe js bindings", () => {
    const source = `
      app Bad {
        sensor UI : events(Click)
        effector Eff {
          bind Hack -> js("eval('alert(1)')")
        }
        runtime {
          tick = RAF
          step {
            ingest [UI]
          }
        }
      }
    `;
    expect(() => compile(source)).toThrow(/Unsafe js binding/);
  });

  it("rejects references to unknown sensors", () => {
    const source = `
      app Bad {
        sensor UI : events(Click)
        runtime {
          tick = RAF
          step {
            ingest [Ghost]
          }
        }
      }
    `;
    expect(() => compile(source)).toThrow(/unknown sensor/);
  });

  it("produces deterministic output for same input", () => {
    const source = fs.readFileSync(path.join(FIXTURES, "minimal.brainweb"), "utf-8");
    const result1 = compile(source);
    const result2 = compile(source);
    expect(result1.js).toBe(result2.js);
    expect(result1.graphJson).toBe(result2.graphJson);
  });
});
