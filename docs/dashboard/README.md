# Smart Adaptive Dashboard

A full-feature showcase of the BrainWeb neuromorphic DSL. The dashboard monitors user interactions across multiple widgets and proactively adapts the UI: highlighting active widgets, suggesting actions, collapsing idle sections, refreshing the activity feed, and showing keyboard shortcuts.

This demo exercises nearly every implemented BrainWeb feature: multiple sensors, all 6 encoder operations, 8-slot context memory with decay, a 6-action circuit, interval-based tick, both guard types, and record/replay.

## How it works

The app is split into two layers:

1. **`app.brainweb`** -- the BrainWeb DSL program that defines the reactive event pipeline.
2. **`index.html`** -- the host page that provides the dashboard UI, widget logic, and 5 distinct `fx` effect functions.

### The BrainWeb pipeline (`app.brainweb`)

```
sensor UI (Click, Input, KeyDown, Focus, Blur)
sensor Mouse (MouseMove, Scroll)
    |
encoder Enc  (dim=128, all 6 ops)
    |
region Cortex.Memory  (state, 8 slots, 10s decay)
    |
circuit Gate  (6 actions, softmax temp=0.7 -> WTA)
    |
effector Eff  -> 5 distinct effects + noop
```

#### Sensors

```
sensor UI    : events(Click, Input, KeyDown, Focus, Blur)
sensor Mouse : events(MouseMove, Scroll)
```

Two sensor domains subscribe to 7 DOM event types total. The `UI` sensor captures discrete interactions (clicks, typing, keyboard shortcuts, focus changes). The `Mouse` sensor captures continuous spatial input (pointer movement, scrolling). Every event is timestamped and normalized into a `BwEvent` with a CSS path identifying the target element.

#### Encoder

```
encoder Enc {
  in = [UI.*, Mouse.*]
  out = FeatureVector dim=128
  policy = {
    onehot(EventType)
    bucket(TimeDelta, 16)
    hash(TargetCssPath, 64)
    numeric(scrollY)
    clamp(inputLen, 0, 100)
    scale(clientX, 0.001)
  }
}
```

Converts events into a 128-dimensional `Float32Array` using all 6 feature operations:

- **`onehot(EventType)`** -- one-hot encoding of the event type across 7 slots (Click, Input, KeyDown, Focus, Blur, MouseMove, Scroll). This tells the brain *what kind* of interaction occurred.
- **`bucket(TimeDelta, 16)`** -- bucketizes the time since the last event into 16 logarithmic bins (0--10 seconds). This encodes the user's interaction *tempo*.
- **`hash(TargetCssPath, 64)`** -- hashes the CSS path of the event target into 64 buckets via MurmurHash3. This encodes *where* on the page the interaction happened.
- **`numeric(scrollY)`** -- normalizes the scroll position using `val / (1 + |val|)`. Encodes vertical scroll depth.
- **`clamp(inputLen, 0, 100)`** -- clamps the input field length to [0, 100]. Encodes how much text the user has typed.
- **`scale(clientX, 0.001)`** -- scales the mouse X coordinate by 0.001. Encodes horizontal pointer position.

#### Region (Context Memory)

```
region Cortex {
  population Memory : state(slots=8, decay=10s, merge="overwrite")
}
```

A short-term memory with 8 slots and a 10-second exponential decay. Each event writes its feature vector and metadata into the next slot (round-robin). The context module computes a decay-weighted average of all slots, giving higher weight to recent interactions. The 10-second window means the brain "remembers" roughly the last 10 seconds of user activity, with older memories gradually fading.

#### Circuit (Action Selection)

```
circuit Gate {
  actions = [HighlightWidget, SuggestTask, CollapseIdle, RefreshFeed, ShowShortcut, Ignore]
  population AV : rate(units=6)
  population W  : winner_take_all(units=6)
  projection AV -> W { topology = softmax(temp=0.7) }
}
```

A 6-action neural gate. The action selector computes scores from the context features via a seeded weight matrix, applies softmax with temperature 0.7 (sharper than the default 1.0, producing more decisive selections), and picks a winner via argmax. Each action produces a **distinct, visible effect**:

| Action | Effect |
|--------|--------|
| `HighlightWidget` | Glows the widget containing the event target |
| `SuggestTask` | Shows a contextual suggestion toast |
| `CollapseIdle` | Fades out widgets not interacted with recently |
| `RefreshFeed` | Adds a status entry to the activity feed |
| `ShowShortcut` | Shows a keyboard shortcut tooltip near the active widget |
| `Ignore` | No-op (the brain decides nothing needs to happen) |

#### Effector

```
effector Eff {
  bind HighlightWidget -> js("fx.highlightWidget(ctx)")
  bind SuggestTask     -> js("fx.suggestTask(ctx)")
  bind CollapseIdle    -> js("fx.collapseIdle(ctx)")
  bind RefreshFeed     -> js("fx.refreshFeed(ctx)")
  bind ShowShortcut    -> js("fx.showShortcut(ctx)")
  bind Ignore          -> noop
}
```

Five JS bindings plus one `noop`. Each `fx` function receives the context object with `ctx.target` (CSS path), `ctx.eventType`, and `ctx.features` (the aggregated feature vector).

#### Runtime Schedule

```
runtime {
  tick = Tick1s
  step {
    ingest [UI, Mouse]
    run Enc
    run Cortex.Memory
    run Gate
    emit Eff from=Gate.W winner_only
  }
  guards {
    max_effects_per_sec = 2
    suppress_repeats(window=5s)
  }
}
```

The brain evaluates on a **1-second interval** (not RAF). This means:
- Events accumulate in the queue between ticks
- The brain "deliberates" once per second, processing the latest batch
- This makes the brain's decision-making visible and dramatic in the debug overlay

Both guards are active:
- **`max_effects_per_sec = 2`** -- at most 2 effects per second (prevents UI spam)
- **`suppress_repeats(window=5s)`** -- the same action cannot fire twice within 5 seconds (ensures variety)

### The host page (`index.html`)

The HTML page provides:

- **Task list widget** -- add tasks via input field, click to toggle done/undone
- **Notes widget** -- textarea for free-form writing, generates Input and Focus/Blur events
- **Metrics widget** -- four stat cards (Events Seen, Actions Taken, Tasks Done, Words Written)
- **Brain Activity feed** -- scrollable log of all brain decisions with timestamps
- **Record/Replay/Reset controls** -- capture an interaction session and replay it deterministically
- **Keyboard shortcuts bar** -- hints for Tab, Enter, Click, Scroll, Type

## Feature coverage

| Feature | click-demo | guess-game | tictactoe | **dashboard** |
|---------|------------|------------|-----------|---------------|
| Sensor event types | 3 | 1 | 1 | **7** |
| Multiple sensors | No | No | No | **Yes (2)** |
| Encoder ops | 4 | 2 | 2 | **6 (all)** |
| Encoder dim | 32 | 16 | 16 | **128** |
| Context slots | 4 | 2 | 2 | **8** |
| Meaningful actions | 3 | 1 | 1 | **6** |
| Interval tick | No | No | No | **Yes (1 Hz)** |
| suppress_repeats | Yes | No | No | **Yes** |
| Record/replay | Yes | No | No | **Yes** |

## Running

```bash
# From the repo root
yarn compile docs/dashboard/app.brainweb --out docs/dashboard/

# Serve
cd docs/dashboard && npx serve .
```

Open http://localhost:3000 and interact with the widgets. Watch the debug overlay (bottom-right) for live brain state: events, encoder heatmap, context slots, action probabilities, and guard decisions.
