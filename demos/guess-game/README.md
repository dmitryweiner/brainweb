# Guess the Button

A simple guessing game built with the BrainWeb neuromorphic DSL.

Three buttons -- A, B, C -- are shown on screen. The computer secretly picks one. You click your guess. Green means correct (score +1), red means wrong (the correct answer is also revealed). After a brief pause the board resets and a new round begins.

## Running

Serve the directory with any HTTP server:

```bash
cd demos/guess-game && npx serve .
```

Open http://localhost:3000 in a browser.

## Recompiling

If you edit `game.brainweb`, regenerate the runtime with:

```bash
yarn compile demos/guess-game/game.brainweb --out demos/guess-game/
```

## How `game.brainweb` works

The file defines a single BrainWeb app called `GuessGame`. It follows the standard pipeline: **Sensor -> Encoder -> Context -> Circuit -> Effector**.

### Sensor

```
sensor UI : events(Click)
```

Subscribes to DOM click events. Every click anywhere on the page is captured and normalized into an internal `BwEvent` with timestamp, event type, and a CSS path identifying the clicked element.

### Encoder

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

Converts each click event into a 16-dimensional `Float32Array` feature vector:

- `onehot(EventType)` -- a one-hot slot for the event type (only `Click` here, so 1 slot).
- `hash(TargetCssPath, 8)` -- hashes the CSS path of the clicked element (e.g. `button#btn-a`) into 8 buckets via MurmurHash3. This gives the downstream modules a compact fingerprint of *what* was clicked.

### Context memory

```
region Core {
  population Ctx : state(slots=2, decay=3s, merge="overwrite")
}
```

A short-term memory with 2 slots that exponentially decays over 3 seconds. Each click writes the latest feature vector and metadata (including `target` -- the CSS path) into the next slot. The context aggregates recent slots into a weighted summary used for action selection. Crucially, `ctx.target` carries the CSS path of the clicked element through to the effector.

### Circuit (action selection)

```
circuit Gate {
  actions = [React, Think]
  population AV : rate(units=2)
  population W : winner_take_all(units=2)
  projection AV -> W { topology = softmax(temp=1.0) }
}
```

A neural gate with two competing actions (`React` and `Think`). The action selector computes scores from the context features via a weight matrix (initialized with a seeded PRNG), applies softmax, and picks a winner. For this game both actions are wired to the same effect, so the gate's choice doesn't affect gameplay -- it just demonstrates the BrainWeb action selection pipeline running.

### Effector

```
effector Eff {
  bind React -> js("fx.evaluate(ctx)")
  bind Think -> js("fx.evaluate(ctx)")
}
```

Both actions invoke the same host function `fx.evaluate(ctx)`. This is the bridge between the BrainWeb runtime and the game logic in `index.html`.

### Runtime loop

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

On every `requestAnimationFrame` tick the pipeline runs in order:

1. **ingest** -- drain queued click events from the sensor.
2. **run Enc** -- encode the latest event into a feature vector.
3. **run Core.Ctx** -- update context memory with the new features.
4. **run Gate** -- score actions and pick a winner.
5. **emit Eff** -- call the winner's bound JS function.

The guard `max_effects_per_sec = 10` throttles effects to at most 10 per second, preventing runaway clicks from overwhelming the UI.

## Game logic (host page)

All game state lives in plain JavaScript inside `index.html`, provided to BrainWeb via the `fx` object:

- `secretButton` -- randomly chosen `"a"`, `"b"`, or `"c"`.
- `score` -- integer counter.
- `locked` -- prevents clicks during the feedback animation.

When `fx.evaluate(ctx)` fires, it extracts the clicked button from `ctx.target` (the CSS path will contain `btn-a`, `btn-b`, or `btn-c`), compares it to the secret, applies green/red styling, updates the score, and after 800ms resets the board for the next round.
