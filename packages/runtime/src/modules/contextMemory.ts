export interface ContextMemoryConfig {
  slots: number;
  decayMs: number;
  featureDim: number;
  merge: string;
}

export interface ContextState {
  target: string;
  eventType: string;
  features: Float32Array;
  [key: string]: any;
}

export class ContextMemory {
  private slots: number;
  private decayMs: number;
  private featureDim: number;
  private slotData: Float32Array[];
  private slotTimes: number[];
  private slotMeta: Record<string, any>[];
  private writeIdx: number = 0;

  constructor(config: ContextMemoryConfig) {
    this.slots = config.slots;
    this.decayMs = config.decayMs;
    this.featureDim = config.featureDim;
    this.slotData = [];
    this.slotTimes = [];
    this.slotMeta = [];
    for (let i = 0; i < this.slots; i++) {
      this.slotData.push(new Float32Array(this.featureDim));
      this.slotTimes.push(0);
      this.slotMeta.push({});
    }
  }

  step(features: Float32Array, meta: Record<string, any>, now: number): ContextState {
    // Apply decay to all slots
    for (let i = 0; i < this.slots; i++) {
      const age = now - this.slotTimes[i];
      if (this.slotTimes[i] > 0 && age > 0) {
        const decay = Math.exp(-age / this.decayMs);
        const data = this.slotData[i];
        for (let j = 0; j < this.featureDim; j++) {
          data[j] *= decay;
        }
      }
    }

    // Write new data to current slot (overwrite merge mode)
    const slot = this.slotData[this.writeIdx];
    slot.set(features.subarray(0, Math.min(features.length, this.featureDim)));
    this.slotTimes[this.writeIdx] = now;
    this.slotMeta[this.writeIdx] = { ...meta };
    this.writeIdx = (this.writeIdx + 1) % this.slots;

    // Build aggregated context: sum all slots (weighted by recency)
    const aggregated = new Float32Array(this.featureDim);
    let totalWeight = 0;
    for (let i = 0; i < this.slots; i++) {
      if (this.slotTimes[i] === 0) continue;
      const age = now - this.slotTimes[i];
      const w = Math.exp(-age / this.decayMs);
      totalWeight += w;
      const data = this.slotData[i];
      for (let j = 0; j < this.featureDim; j++) {
        aggregated[j] += data[j] * w;
      }
    }
    if (totalWeight > 0) {
      for (let j = 0; j < this.featureDim; j++) {
        aggregated[j] /= totalWeight;
      }
    }

    // Find most recent meta for context output
    let latestMeta: Record<string, any> = {};
    let latestTime = 0;
    for (let i = 0; i < this.slots; i++) {
      if (this.slotTimes[i] > latestTime) {
        latestTime = this.slotTimes[i];
        latestMeta = this.slotMeta[i];
      }
    }

    return {
      target: latestMeta.target ?? "",
      eventType: latestMeta.eventType ?? "",
      features: aggregated,
      ...latestMeta,
    };
  }

  getSlotData(): Float32Array[] {
    return this.slotData;
  }
}
