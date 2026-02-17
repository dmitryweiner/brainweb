export interface ActionSelectorConfig {
  actions: string[];
  featureDim: number;
  temperature: number;
  seed: number;
}

export class ActionSelector {
  private actions: string[];
  private weights: Float32Array;
  private featureDim: number;
  private temperature: number;
  private values: Float32Array;
  private probs: Float32Array;

  constructor(config: ActionSelectorConfig) {
    this.actions = config.actions;
    this.featureDim = config.featureDim;
    this.temperature = config.temperature;
    const numActions = config.actions.length;
    this.values = new Float32Array(numActions);
    this.probs = new Float32Array(numActions);

    // Initialize weights: small random values from seeded PRNG
    this.weights = new Float32Array(numActions * config.featureDim);
    let rng = config.seed;
    for (let i = 0; i < this.weights.length; i++) {
      rng = xorshift32(rng);
      this.weights[i] = ((rng >>> 0) / 0xffffffff - 0.5) * 0.1;
    }
  }

  step(contextFeatures: Float32Array): { winner: number; values: Float32Array; probs: Float32Array } {
    const n = this.actions.length;

    // Linear scoring: values[a] = sum(weights[a*dim + j] * features[j])
    for (let a = 0; a < n; a++) {
      let sum = 0;
      const base = a * this.featureDim;
      for (let j = 0; j < this.featureDim; j++) {
        sum += this.weights[base + j] * (contextFeatures[j] ?? 0);
      }
      this.values[a] = sum;
    }

    // Softmax with temperature
    softmax(this.values, this.probs, this.temperature);

    // Deterministic argmax (lowest index wins ties)
    let winner = 0;
    let maxVal = this.probs[0];
    for (let a = 1; a < n; a++) {
      if (this.probs[a] > maxVal) {
        maxVal = this.probs[a];
        winner = a;
      }
    }

    return {
      winner,
      values: new Float32Array(this.values),
      probs: new Float32Array(this.probs),
    };
  }

  getActions(): string[] {
    return this.actions;
  }
}

function softmax(input: Float32Array, output: Float32Array, temperature: number): void {
  const n = input.length;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const v = input[i] / temperature;
    if (v > max) max = v;
  }
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const e = Math.exp(input[i] / temperature - max);
    output[i] = e;
    sum += e;
  }
  if (sum > 0) {
    for (let i = 0; i < n; i++) {
      output[i] /= sum;
    }
  }
}

function xorshift32(state: number): number {
  state ^= state << 13;
  state ^= state >> 17;
  state ^= state << 5;
  return state;
}
