# **1\) Language Specification (BrainWeb DSL)**

## **1.0 Goals and Non-Goals**

**Goals**

* Describe an event-driven web application as a set of **modules** connected by **signal paths**.

* First-class support for:

  * browser event ingestion (DOM, timers, network),

  * feature encoding,

  * stateful context / attention,

  * action selection / gating,

  * effect emission (DOM changes, fetch, storage),

  * runtime schedule and safety guards.

* Transpile to JS that runs in the browser with a deterministic core loop and debuggable logs.

**Non-goals**

* Full neural fidelity, continuous dynamics, “real brain” correctness proofs.

* Hard real-time.

* Arbitrary JS embedding inside the DSL (we allow controlled `js("...")` bindings only).

---

## **1.1 Source Files**

* Extension: `.brainweb` (or `.bw`)

* One file defines one `app`.

* Imports are optional; MVP: single file, no imports.

---

## **1.2 Lexical Rules**

* Whitespace: spaces, tabs, newlines ignored except as separators.

* Comments:

  * line: `// ...`

  * block: `/* ... */`

* Identifiers: `[A-Za-z_][A-Za-z0-9_]*`

* String: double quotes `"..."` with `\"` escapes

* Numbers:

  * int: `123`

  * float: `0.25`

* Time literals:

  * `1ms`, `10ms`, `1s`, `2.5s`, `10m` (minutes)

* Lists: `[a, b, c]`

* Records: `{ key = value, ... }` (note: use `=` not `:` to keep grammar uniform)

---

## **1.3 Top-Level Structure**

Exactly one:

`app <AppName> {`  
  `<declarations...>`  
`}`

Declarations may appear in any order; references must resolve after a linking phase.

Allowed declarations:

* `sensor`

* `encoder`

* `region`

* `circuit`

* `modulator`

* `effector`

* `runtime`

---

## **1.4 Sensors (Event Sources)**

### **Syntax**

`sensor <Name> : events(<EventTypeList>)`

Example:

`sensor UI : events(Click, Input, KeyDown, Scroll, Focus)`  
`sensor Net : events(FetchOk, FetchErr, WsMsg)`  
`sensor Time: events(RAF, Tick100ms, Tick1s)`  
`sensor Vis : events(VisibilityChange)`

### **Semantics**

* A `sensor` defines a *subscription domain*.

* Concrete mapping to browser sources is done by the runtime:

  * `UI.Click` → `document.addEventListener("click", ...)`

  * `Time.RAF` → `requestAnimationFrame`

  * `Time.Tick100ms` → `setInterval(100)`

  * `Net.FetchOk/Err` → runtime-wrapped `fetch` or user effect that pushes events back.

* Events produced are normalized into an internal representation:

Minimal internal event:

`type BwEvent = {`  
  `sensor: string;      // "UI"`  
  `type: string;        // "Click"`  
  `t: number;           // performance.now() in ms`  
  `payload?: any;       // normalized payload (safe JSON)`  
`}`

---

## **1.5 Encoders (Event → FeatureVector)**

### **Syntax**

`encoder <Name> {`  
  `in  = [<SensorPatternList>]`  
  `out = FeatureVector dim=<N>`  
  `policy = { <feature_ops...> }`  
`}`

Sensor patterns:

* `UI.*` (all events from sensor)

* `UI.Click` (specific)

* `*.*` allowed (discourage; too broad)

Feature ops (MVP set):

* `onehot(EventType)`

* `bucket(TimeDelta, <bins>)`

* `hash(<Field>, <buckets>)`

* `numeric(<Field>)`

* `clamp(<Field>, min, max)`

* `scale(<Field>, factor)`

Example:

`encoder EventEncoder {`  
  `in  = [UI.*, Net.*, Time.*, Vis.*]`  
  `out = FeatureVector dim=192`  
  `policy = {`  
    `onehot(EventType)`  
    `bucket(TimeDelta, 16)`  
    `hash(TargetCssPath, 64)`  
    `hash(TextPayload, 32)`  
    `numeric(ScrollY_norm)`  
    `numeric(InputLen_norm)`  
  `}`  
`}`

### **Semantics**

* Encoders are pure: given a batch of events \+ “now”, produce a fixed-size float array (`Float32Array`).

* Feature hashing uses stable hashing (e.g., MurmurHash3) to keep determinism.

* Encoder may maintain tiny state for `TimeDelta` (last event timestamp), but it must be deterministic and serializable.

---

## **1.6 Regions, Populations, Projections**

This is the “graph of computation”.

### **Regions**

`region <Name> {`  
  `<population...>`  
  `<projection...>`  
`}`

### **Populations**

Populations are named modules with internal state and a `step()` function.

#### **State population (Context/Memory)**

`population <Name> : state(`  
  `slots=<N>,`  
  `decay=<time>,`  
  `merge="<mergeMode>"`  
`)`

* `mergeMode`: `"soft-attend"` | `"overwrite"` | `"wta"` (MVP: accept as string, runtime implements 1–2)

#### **Spiking population (Patterns)**

`population <Name> : spiking(`  
  `neurons=<N>,`  
  `neuron=LIF(tau=<time>, refr=<time>),`  
  `target_rate=<Hz>,`  
  `inhibition="<mode>"`  
`)`

* The runtime does not need “real spikes”; it can implement:

  * a thresholded activation producing a sparse list of indices (“spike list”),

  * plus homeostatic scaling to approximate target rate.

#### **Recurrent population (Predictor)**

`population <Name> : recurrent(neurons=<N>, dt=<time>)`

Minimal semantics: a recurrent state vector updated each tick from inputs \+ its own previous state.

### **Projections (Connections)**

`projection <From> -> <To> {`  
  `topology = <topologyExpr>`  
  `weight_init = <initExpr>`  
  `rule = <learningRuleExpr>   // optional`  
`}`

Topologies (MVP):

* `dense`

* `sparse_random(p=<float>, seed=<int>)`

* `local(radius=<int>)` (optional)

* `linear` (treat as a matrix multiply from context to action values)

Weight init:

* `normal(mu, sigma)`

* `uniform(a, b)`

* `constant(c)`

Learning rules (MVP):

* `hebbian(trace=<time>)`

* `none` (default)

### **Semantics**

* Populations are executed according to the `runtime.step` plan.

* Projections compile into concrete data structures:

  * dense → `Float32Array` matrix (or implicit linear layer),

  * sparse\_random → CSR adjacency lists,

  * local → computed indices by formula (optional).

* Learning rules update weights during step; they must remain bounded (runtime clamps).

---

## **1.7 Circuits (Action Selection / Gating)**

### **Syntax**

`circuit <Name> {`  
  `actions = [A, B, C, ...]`  
  `population ActionValues : rate(units=len(actions))`  
  `population Gate         : winner_take_all(units=len(actions))`

  `projection <Src> -> ActionValues { topology = linear }`  
  `projection ActionValues -> Gate  { topology = softmax(temp=<float>) }`

  `modulator <Name> { source = reward(...) }         // optional`  
  `plasticity ActionValues { rule = reward_hebbian(...), ... } // optional`  
`}`

MVP actions:

* a list of identifiers that correspond to effect bindings.

Gate behavior:

* `winner_take_all` returns a single action index per decision step (ties broken deterministically).

---

## **1.8 Modulators (Reward / User Feedback)**

### **Syntax (MVP)**

`modulator <Name> {`  
  `source = reward(from=<EventPattern>, from=<EventPattern>, ...)`  
`}`

### **Semantics**

* Modulators compute scalar signals from event streams, e.g.:

  * user accepted suggestion → \+1

  * user canceled → −1

* Used by plasticity rules.

MVP: modulators exist but can be stubbed if learning is postponed.

---

## **1.9 Effectors (Bindings to JS Effects)**

### **Syntax**

`effector <Name> {`  
  `bind <ActionName> -> js("<callExpr>")`  
  `bind <ActionName> -> noop`  
`}`

Example:

`effector Actions {`  
  `bind ShowToast       -> js("fx.toast(ctx)")`  
  `bind HighlightTarget -> js("fx.highlight(ctx.target)")`  
  `bind FetchSuggest    -> js("fx.fetchSuggest(ctx)")`  
  `bind Ignore          -> noop`  
`}`

### **Semantics**

* The transpiled code provides an `fx` object (supplied by the host app).

* `ctx` is the current context object produced by the `Context` population (serializable).

* `js("...")` is *not arbitrary JS*: it must match a restricted grammar:

  * `fx.<ident>(<args...>)` where args are `ctx` or `ctx.<field>` literals.

* This restriction prevents the DSL from becoming a Trojan horse.

---

## **1.10 Runtime Block (Schedule and Guards)**

### **Syntax**

`runtime {`  
  `tick = RAF | Tick100ms | Tick1s | <time>`  
  `step {`  
    `ingest [<SensorNames...>]`  
    `run <ModuleRef> [dt=<time>] [when=<TimeEvent>]`  
    `emit <EffectorName> from=<GateRef> winner_only`  
  `}`  
  `guards {`  
    `max_effects_per_sec = <int>`  
    `suppress_repeats(window=<time>)`  
    `keep_target_rate(<PopRef>, <Hz>)`  
  `}`  
`}`

### **Semantics**

* A single main loop runs on `requestAnimationFrame` by default.

* `ingest` drains the event queue (or drains only specified sensors).

* `run` calls module step functions in order; modules may run at their own `dt`.

* `emit` takes the winner from a gate and invokes the corresponding effector binding.

* Guards enforce safety:

  * throttle effects,

  * avoid repeated identical effects,

  * maintain homeostasis (if supported).

---

## **1.11 Determinism and Replay**

Required runtime features:

* A “record mode” that logs:

  * all ingested events (normalized),

  * all random seeds used,

  * all chosen actions.

* A “replay mode” that replays events against the same seeds to reproduce behavior.

---
