# BrainWeb

A web-only transpiler for a small DSL that describes event-driven applications as brain-like graphs: **Sensors -> Encoder -> Regions/Populations -> Action Selection (Gate) -> Effectors**, executed on a deterministic schedule via `requestAnimationFrame`.

BrainWeb compiles `.brainweb` source files into self-contained browser JavaScript that wires DOM events through an encoder, a context memory module, and an action selector -- then emits effects like toasts, highlights, or API calls.

## Architecture

```
                    .brainweb source
                         |
                  [ Lexer (Chevrotain) ]
                         |
                  [ Parser -> CST ]
                         |
                  [ Visitor -> AST ]
                         |
                  [ Validator ]
                  (names, types, js("...") safety)
                         |
                  [ Lowering -> IR ]
                         |
                  [ Code Generator ]
                    /          \
      app.runtime.js        app.graph.json
      (self-contained)      (IR for debugging)
```

The generated `app.runtime.js` inlines a minimal runtime and runs in any modern browser with zero dependencies.

## Project Structure

```
brainweb/
  packages/
    compiler/           # DSL -> JS transpiler
      src/
        lexer.ts        # Chevrotain token definitions
        parser.ts       # CST parser
        visitor.ts      # CST -> AST
        ast.ts          # AST node types
        ir.ts           # Intermediate Representation types
        validate.ts     # Name resolution, type checks, binding safety
        lower.ts        # AST -> IR lowering
        codegen.ts      # IR -> browser JS generation
        cli.ts          # brainwebc CLI
        index.ts        # Public API (compile function)
      test/
        compiler.test.ts
        fixtures/
    runtime/            # TypeScript runtime library (also inlined by codegen)
      src/
        eventQueue.ts   # Event buffer
        sensors.ts      # DOM event wiring + normalization
        encoder.ts      # Feature vector encoder (onehot, hash, bucket, numeric)
        hash.ts         # Deterministic MurmurHash3
        guards.ts       # Effect throttling + repeat suppression
        loop.ts         # rAF / interval main loop
        debug.ts        # Debug overlay + record/replay
        modules/
          contextMemory.ts   # Stateful context with decay
          actionSelector.ts  # Linear scoring + softmax + argmax
  demo/
    demo.brainweb       # Example program
    index.html          # Host page with fx implementations
    app.runtime.js      # Generated output (do not edit)
    app.graph.json      # Generated IR dump
```

## Quick Start

### Prerequisites

- Node.js >= 18
- Yarn

### Install dependencies

```bash
yarn install
```

### Build the compiler

```bash
yarn build
```

### Compile a `.brainweb` program

```bash
node packages/compiler/dist/cli.js demo/demo.brainweb --out demo/
```

Or use the convenience script:

```bash
yarn compile demo/demo.brainweb --out demo/
```

### Run the demo

Serve the `demo/` directory with any HTTP server:

```bash
cd demo && npx serve .
```

Open http://localhost:3000 in your browser. Click buttons, type text, and scroll -- the debug overlay in the bottom-right corner shows live event ingestion, context state, action probabilities, and the chosen winner.

### Run tests

```bash
yarn test
```

## The BrainWeb DSL

A `.brainweb` file defines a single `app` containing sensors, an encoder, regions with populations, a circuit for action selection, effector bindings, and a runtime schedule.

### Minimal example

```
app HelloBrain {

  sensor UI : events(Click)

  encoder Enc {
    in = [UI.*]
    out = FeatureVector dim=16
    policy = {
      onehot(EventType)
      hash(TargetCssPath, 8)
    }
  }

  region Core {
    population Ctx : state(slots=2, decay=3s, merge="overwrite")
  }

  circuit Gate {
    actions = [Greet, Ignore]
    population AV : rate(units=2)
    population W : winner_take_all(units=2)
    projection AV -> W { topology = softmax(temp=1.0) }
  }

  effector Eff {
    bind Greet -> js("fx.greet(ctx)")
    bind Ignore -> noop
  }

  runtime {
    tick = RAF
    step {
      ingest [UI]
      run Enc
      run Core.Ctx
      run Gate
      emit Eff from=Gate.W winner_only
    }
    guards {
      max_effects_per_sec = 3
    }
  }
}
```

### Host page

The generated JS exposes `window.BrainWeb.createApp(fx, opts)`. Your HTML provides the `fx` object:

```html
<script src="app.runtime.js"></script>
<script>
  const fx = {
    greet: function(ctx) {
      alert("Hello! You clicked on " + ctx.target);
    }
  };

  const app = BrainWeb.createApp(fx, { seed: 42, debug: true });
  app.start();
</script>
```

### App control API

The object returned by `createApp` exposes:

| Method | Description |
|---|---|
| `app.start()` | Wire sensors and start the rAF loop |
| `app.stop()` | Stop the loop and disconnect sensors |
| `app.startRecording()` | Begin recording events and actions |
| `app.stopRecording()` | Stop recording, returns a JSON array of entries |
| `app.replay(entries)` | Replay a recorded log (deterministic) |
| `app.getGraph()` | Returns the IR graph object |
| `app.destroy()` | Stop, disconnect, remove debug overlay |

## DSL Reference

### Sensors

Define event sources. The runtime maps event type names to DOM listeners.

```
sensor UI : events(Click, Input, KeyDown, Scroll, Focus)
sensor Vis : events(VisibilityChange)
```

Supported event types: `Click`, `Input`, `KeyDown`, `KeyUp`, `Scroll`, `Focus`, `Blur`, `MouseMove`, `VisibilityChange`.

### Encoders

Convert events to a fixed-size `Float32Array`.

```
encoder Enc {
  in = [UI.*, Vis.*]
  out = FeatureVector dim=64
  policy = {
    onehot(EventType)
    bucket(TimeDelta, 16)
    hash(TargetCssPath, 32)
    numeric(ScrollY_norm)
  }
}
```

Feature operations: `onehot`, `bucket`, `hash`, `numeric`, `clamp`, `scale`.

### Regions and Populations

Group stateful modules.

```
region Cortex {
  population Memory : state(slots=8, decay=10s, merge="overwrite")
  population Patterns : spiking(
    neurons=256,
    neuron=LIF(tau=20ms, refr=2ms),
    target_rate=5,
    inhibition="lateral"
  )
}
```

Population kinds: `state`, `spiking`, `recurrent`, `rate`, `winner_take_all`.

### Circuits (Action Selection)

Define the action gate with scoring and winner-take-all selection.

```
circuit ActionGate {
  actions = [ShowToast, HighlightTarget, Ignore]
  population ActionValues : rate(units=len(actions))
  population Gate : winner_take_all(units=len(actions))
  projection ActionValues -> Gate { topology = softmax(temp=0.5) }
}
```

### Effectors

Bind actions to restricted JS calls. Only `fx.<ident>(ctx|ctx.<field>|literal)` is allowed.

```
effector Actions {
  bind ShowToast -> js("fx.toast(ctx)")
  bind HighlightTarget -> js("fx.highlight(ctx.target)")
  bind Ignore -> noop
}
```

### Runtime

Configure the main loop schedule and safety guards.

```
runtime {
  tick = RAF
  step {
    ingest [UI]
    run Encoder
    run Cortex.Memory
    run ActionGate
    emit Actions from=ActionGate.Gate winner_only
  }
  guards {
    max_effects_per_sec = 5
    suppress_repeats(window=2s)
  }
}
```

## Key Design Properties

- **Deterministic**: Seeded PRNG (xorshift32), stable MurmurHash3 for feature hashing, lowest-index-wins argmax tie-breaking.
- **Safe bindings**: `js("...")` expressions are validated against a strict pattern -- no arbitrary code execution.
- **Allocation-light**: The rAF loop reuses `Float32Array` buffers for encoder output, action values, and context features.
- **Record/replay**: Events and actions are recorded as JSON; replaying the log against the same seed reproduces identical behavior.
- **Debug overlay**: Real-time visualization of events, context state, action probabilities, winner selection, and guard rejections.

## License

MIT
