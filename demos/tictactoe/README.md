# Tic-Tac-Toe Demo

A classic tic-tac-toe game (human vs computer) built with the BrainWeb neuromorphic DSL. The human plays as **X**, the computer plays as **O** using an unbeatable minimax algorithm.

## How it works

The game is split into two layers:

1. **`tictactoe.brainweb`** -- the BrainWeb DSL program that defines the reactive event pipeline.
2. **`index.html`** -- the host page that provides the UI, game state, AI logic, and the `fx` effect functions.

The BrainWeb runtime acts as a neuromorphic event router: it captures raw DOM clicks, encodes them into a feature vector, maintains short-term context, selects an action through a winner-take-all gate, and calls the bound effect function with context about what was clicked.

### The BrainWeb pipeline (`tictactoe.brainweb`)

```
sensor UI : events(Click)
    |
encoder Enc  (dim=16, onehot + hash)
    |
region Core.Ctx  (state memory, 2 slots, 3s decay)
    |
circuit Gate  (actions: Play / Idle, softmax -> WTA)
    |
effector Eff  -> fx.handleMove(ctx)
```

Each block in `tictactoe.brainweb` corresponds to a stage in the processing loop:

#### Sensor

```
sensor UI : events(Click)
```

Subscribes to all DOM `click` events. Every click anywhere on the page is captured, timestamped, and pushed into the event queue as a normalized `BwEvent` with fields like `sensor`, `type`, `t`, and `payload` (which includes `target` -- the CSS path of the clicked element).

#### Encoder

```
encoder Enc {
  in = [UI.*]
  out = FeatureVector dim=16
  policy = {
    onehot(EventType)
    hash(TargetCssPath, 8)
  }
}
```

Converts the raw event into a fixed-size `Float32Array` of 16 dimensions:
- `onehot(EventType)` -- a one-hot encoding of the event type (here just "Click", so 1 slot).
- `hash(TargetCssPath, 8)` -- hashes the CSS path of the clicked DOM element (e.g. `div#cell-4`) into 8 buckets using MurmurHash3. This is how the system distinguishes which cell was clicked without any hardcoded knowledge of the grid.

#### Region (Context Memory)

```
region Core {
  population Ctx : state(slots=2, decay=3s, merge="overwrite")
}
```

A short-term memory with 2 slots and exponential decay (3 second half-life). Each incoming feature vector is written into one slot in round-robin fashion. The context module aggregates all slots into a weighted average (more recent = higher weight) and exposes metadata like `ctx.target` and `ctx.eventType` from the most recent event.

#### Circuit (Action Selection)

```
circuit Gate {
  actions = [Play, Idle]
  population AV : rate(units=2)
  population W : winner_take_all(units=2)
  projection AV -> W { topology = softmax(temp=1.0) }
}
```

The action gate scores each action using a linear projection from the context feature vector, applies softmax normalization (temperature=1.0), and selects the winner via argmax. The two actions (`Play` and `Idle`) both route to the same effect function, so the gate simply ensures an action is always selected when an event occurs.

#### Effector

```
effector Eff {
  bind Play -> js("fx.handleMove(ctx)")
  bind Idle -> js("fx.handleMove(ctx)")
}
```

Maps each action to a JavaScript function call. The `ctx` object passed to `fx.handleMove` contains:
- `ctx.target` -- CSS path of the clicked element (e.g. `"div#cell-4"`)
- `ctx.eventType` -- the event type string (e.g. `"Click"`)
- `ctx.features` -- the aggregated feature vector

#### Runtime Schedule

```
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
    max_effects_per_sec = 10
  }
}
```

On every `requestAnimationFrame` tick, the runtime executes these steps in order:
1. **Ingest** -- drain the event queue from the UI sensor.
2. **Encode** -- convert the latest event batch into a feature vector.
3. **Context** -- update the memory slots and compute the aggregated context.
4. **Gate** -- score actions and pick a winner.
5. **Emit** -- if the guard allows it (max 10 effects/sec), call the winning action's bound `fx` function.

If no events arrived since the last tick, steps 2-5 are skipped (no-op tick).

### The host page (`index.html`)

The HTML page provides:

- **3x3 grid UI** -- nine `<div class="cell" id="cell-0">` through `cell-8` elements.
- **Game state** -- a `board[9]` array, win detection against 8 possible lines, and a score tracker.
- **Minimax AI** -- a recursive minimax function that evaluates all possible game trees. On a 3x3 board this is trivially fast (at most 9! leaf nodes). The computer always plays optimally -- the best a human can achieve is a draw.
- **`fx.handleMove(ctx)`** -- the single entry point called by BrainWeb. It parses `ctx.target` to find which cell was clicked (by matching `"cell-0"` through `"cell-8"` in the CSS path string), places the human's X, runs the AI for O, and checks for win/draw after each move.

## Running

```bash
# From the repo root
yarn compile demos/tictactoe/tictactoe.brainweb --out demos/tictactoe/

# Serve
cd demos/tictactoe && npx serve .
```

Open http://localhost:3000 and click any cell to play.
