
# **2\) How to Build the Web Transpiler (Detailed Guide)**

## **2.0 Target Output**

Transpilation produces:

1. `generated/app.runtime.js`

   * event queue \+ sensor wiring \+ main loop \+ module instances \+ guard logic.

2. `generated/app.graph.json`

   * serialized IR graph for debugging/visualization.

3. Optional: `generated/app.types.d.ts`

   * types for `fx` bindings and context object.

Your host app provides:

* an `fx` object with functions,

* optional UI widgets for debug panels,

* optional wrappers for fetch/websocket to push Net events.

---

## **2.1 Implementation Plan (the sane order)**

### **Step 1: Define IR (do this before parsing)**

You want a simple, explicit structure that codegen can consume.

Core IR types:

`type AppIR = {`  
  `name: string;`  
  `sensors: SensorIR[];`  
  `encoders: EncoderIR[];`  
  `modules: ModuleIR[];         // populations, circuits compiled to modules`  
  `projections: ProjectionIR[];`  
  `effectors: EffectorIR[];`  
  `runtime: RuntimeIR;`  
`};`

`type ModuleIR =`  
  `| { kind: "Encoder"; name: string; spec: EncoderIR; }`  
  `| { kind: "State"; name: string; spec: StatePopIR; }`  
  `| { kind: "Spiking"; name: string; spec: SpikingPopIR; }`  
  `| { kind: "Recurrent"; name: string; spec: RecurrentPopIR; }`  
  `| { kind: "ActionSelector"; name: string; spec: ActionSelectorIR; };`

`type ProjectionIR = {`  
  `from: string;    // module output port`  
  `to: string;      // module input port`  
  `topology: TopologyIR;`  
  `init: InitIR;`  
  `learning?: LearningIR;`  
`};`

`type RuntimeIR = {`  
  `tick: { mode: "RAF" | "Interval"; ms?: number };`  
  `steps: StepIR[];`  
  `guards: GuardIR[];`  
`};`

Keep ports implicit at MVP:

* encoders output `FeatureVector`

* patterns output `spikes: Uint32Array`

* context output `ctx: object`

* predictor output `pred: Float32Array`

* action selector output `winner: number`

You can add explicit ports later.

---

## **2.2 Parsing (TypeScript \+ Chevrotain, single-file MVP)**

I’ll pick **Chevrotain** because it’s practical, fast, and friendly for custom DSLs.

### **Project layout**

`brainweb/`  
  `packages/`  
    `compiler/`  
      `src/`  
        `lexer.ts`  
        `parser.ts`  
        `ast.ts`  
        `lower.ts      // AST -> IR`  
        `validate.ts`  
        `codegen/`  
          `jsRuntime.ts`  
          `templates.ts`  
        `index.ts`  
      `test/`  
        `fixtures/`  
        `snapshots/`  
    `runtime/`  
      `src/`  
        `core.ts`  
        `sensors.ts`  
        `guards.ts`  
        `modules/`  
          `encoder.ts`  
          `state.ts`  
          `spiking.ts`  
          `recurrent.ts`  
          `actionSelector.ts`

Split “compiler” and “runtime” early. The transpiled output imports runtime pieces or inlines them.

### **Lexer**

Tokenize keywords: `app, sensor, encoder, region, population, projection, circuit, modulator, effector, runtime, ingest, run, emit, bind, js, noop, events, FeatureVector, dim, policy, topology, weight_init, rule, actions, guards, tick, dt, when, from, winner_only`

Time literal token: regex like `/\d+(\.\d+)?(ms|s|m)/`.

### **Parser**

Parse into AST nodes:

* `AppNode`

* `SensorNode`

* `EncoderNode`

* `RegionNode`

* `PopulationNode`

* `ProjectionNode`

* `CircuitNode`

* `EffectorNode`

* `RuntimeNode`

Keep AST close to syntax; don’t “interpret” too early.

---

## **2.3 Validation and Linking (AST passes)**

Implement these passes in order:

1. **Name resolution**

* Build symbol tables for sensors, modules, effectors.

* Ensure references exist (`projection From -> To` resolves).

* Ensure action names in circuits have bindings in effectors (or allow unresolved with warning).

2. **Type sanity (very lightweight)**

* Encoder out dim is positive.

* Pop sizes are positive.

* Topology params within ranges (e.g., `0 < p <= 1`).

* `runtime.step` references valid modules.

3. **Effect binding safety**

* Parse `js("...")` with a tiny restricted parser:

  * must be `fx.<ident>(...)`

  * args must be `ctx` or `ctx.<ident>` or literals (optional).  
     Reject anything else.

This is where you save your future self from misery.

---

## **2.4 Lowering: AST → IR**

This is the heart of the “compiler”.

Strategy:

* Convert each population/circuit into a `ModuleIR`.

* Convert each projection to `ProjectionIR`.

* Expand circuits into a single `ActionSelector` module IR (internally it holds actions list and computes winner).

Important: resolve hierarchical names:

* `Cortex.Patterns` becomes module name `Cortex__Patterns` in IR (safe JS identifier).

* Maintain a mapping table for diagnostics.

---

## **2.5 Code Generation: IR → JS**

### **Output style**

Generate **one module** that exports `createApp(fx, opts)`:

`export function createApp(fx, opts = {}) {`  
  `const app = new BwRuntimeApp({ fx, opts, graph: /*...*/ });`  
  `app.start();`  
  `return app;`  
`}`

Or if you want no bundler, generate an IIFE that attaches to `window`.

### **2.5.1 Generate the “graph object”**

Emit a JSON literal inside JS (or a separate `.json` file).  
 This helps with debug UIs.

### **2.5.2 Instantiate runtime modules**

Generate code like:

`const encoder = new Encoder_192(/* policy */);`  
`const patterns = new SpikingLIF(/* N, params */);`  
`const context = new ContextMemory(/* slots, decay */);`  
`const predictor = new Recurrent(/* ... */);`  
`const actionSel = new ActionSelector([/* actions */], /* temp */);`

`const proj_event_patterns = buildSparseRandomProj(/* seed, p, dims */);`  
`...`

### **2.5.3 Build the step plan**

Represent runtime steps as an array of functions (fast enough for MVP):

`const plan = [`  
  `(now) => ingestSensors(now),`  
  `(now) => features = encoder.encode(drainEvents(), now),`  
  `(now) => patterns.step(features, proj_event_patterns, now),`  
  `(now) => ctx = context.step(patterns.spikes(), proj_patterns_context, now),`  
  `(now) => predictor.step(ctx, now),`  
  `(now) => winner = actionSel.step(ctx, predictor.out(), now),`  
  `(now) => emitEffect(winner, ctx, fx, guards, now),`  
`];`

### **2.5.4 Sensors wiring (browser glue)**

Generate a standard, minimal sensor layer:

* Each DOM listener normalizes and pushes to `eventQueue`.

* Use a small `normalizeDomEvent(ev)` that extracts safe fields (type, key, target selector path, value length, scroll).

Do not store raw DOM nodes in events.

### **2.5.5 Effects emission**

Compile `bind Action -> js("fx.toast(ctx)")` into a table:

`const effectTable = {`  
  `ShowToast: (ctx) => fx.toast(ctx),`  
  `HighlightTarget: (ctx) => fx.highlight(ctx.target),`  
  `Ignore: () => {},`  
`};`

Then:

`const actionName = actionSel.actions[winner];`  
`effectTable[actionName]?.(ctx);`

---

## **2.6 Runtime Implementation (the minimal one that works)**

### **2.6.1 Event queue \+ ingestion**

* `eventQueue: BwEvent[]`

* `drainQueue(max = Infinity)` returns an array; optionally keep separate per sensor.

### **2.6.2 Timing model**

* Use `performance.now()` in ms.

* Main loop via `requestAnimationFrame(loop)`.

* For interval ticks (100ms, 1s), push synthetic Time events or run a second loop; MVP: push events.

### **2.6.3 Modules (simple, deterministic)**

Implement modules with deterministic math:

* Encoder: stable hash, stable bucketization.

* Spiking: thresholded activation from linear projection \+ leaky integration.

* Context: slots with decay; merge by softmax attention weights.

* Recurrent: simple tanh / leaky update.

* ActionSelector: linear scoring \+ softmax \+ argmax (deterministic).

Even if you call it “spiking”, keep it cheap and predictable.

---

## **2.7 Guards (so it doesn’t become possessed)**

Implement:

* `max_effects_per_sec`

* `suppress_repeats(windowMs)`

Mechanism:

* Keep a ring buffer of recent effects `{t, actionName, key}` where key might include a coarse context hash.

* Deny emit if violates guard.

Also: fail-safe

* If module throws, stop loop and expose error state.

---

## **2.8 Debugging Tooling (mandatory for sanity)**

Generate (or provide) a debug overlay:

* live event rate

* last N events

* current context slots

* action values \+ chosen winner

* guard rejections

Add record/replay:

* `app.startRecording()`, `app.stopRecording()` returns JSON.

* `app.replay(recording)` runs without real DOM listeners.

This is where you’ll actually “program” the system, because emergent loops are slippery.

---

## **2.9 Testing Strategy (don’t skip)**

1. **Parser tests**

* fixtures `.brainweb` → AST snapshots.

2. **Lowering tests**

* AST → IR snapshots.

3. **Codegen tests**

* IR → JS snapshot \+ quick `node --check` syntax test.

4. **Determinism tests**

* Given a fixed event log and seed, winner sequence must match snapshot.

---

## **2.10 Performance Notes (browser reality)**

* Keep allocations low inside the rAF loop:

  * reuse arrays,

  * store vectors in typed arrays,

  * batch events.

* If modules become heavy:

  * run compute in a Web Worker,

  * main thread only ingests events and applies effects.

  * Worker returns `{winner, ctxDelta}`; ctxDelta is small and serializable.

---

## **2.11 Concrete “first milestone” checklist**

* Lexer \+ parser for `app/sensor/encoder/region/population/projection/effector/runtime`

* AST validation (names \+ binding safety)

* Lowering to IR

* Codegen JS that runs in browser with:

  * eventQueue

  * rAF loop

  * one encoder

  * one context module

  * one action selector

  * effect bindings

* Example app with 2 actions: `ShowToast`, `Ignore`

* Debug overlay showing chosen action
