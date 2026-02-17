import { BwEvent } from "./types";
import { murmurhash3 } from "./hash";

export interface FeatureOpConfig {
  kind: string;
  field: string;
  buckets?: number;
  bins?: number;
  min?: number;
  max?: number;
  factor?: number;
}

export interface EncoderConfig {
  dim: number;
  featureOps: FeatureOpConfig[];
  eventTypeList: string[];
}

export class Encoder {
  private dim: number;
  private ops: FeatureOpConfig[];
  private output: Float32Array;
  private eventTypeList: string[];
  private lastEventTime: number = 0;

  constructor(config: EncoderConfig) {
    this.dim = config.dim;
    this.ops = config.featureOps;
    this.output = new Float32Array(config.dim);
    this.eventTypeList = config.eventTypeList;
  }

  encode(events: BwEvent[], now: number): Float32Array {
    this.output.fill(0);
    if (events.length === 0) return this.output;

    let offset = 0;
    const ev = events[events.length - 1]; // use most recent event

    for (const op of this.ops) {
      switch (op.kind) {
        case "onehot": {
          const idx = this.eventTypeList.indexOf(ev.type);
          const slots = Math.min(this.eventTypeList.length, this.dim - offset);
          if (idx >= 0 && idx < slots) {
            this.output[offset + idx] = 1.0;
          }
          offset += slots;
          break;
        }
        case "bucket": {
          const bins = op.bins ?? 16;
          const dt = now - this.lastEventTime;
          // Map time delta to a bucket (logarithmic scale, 0-10s range)
          const maxMs = 10000;
          const normalized = Math.min(dt / maxMs, 1.0);
          const bucket = Math.min(Math.floor(normalized * bins), bins - 1);
          if (offset + bucket < this.dim) {
            this.output[offset + bucket] = 1.0;
          }
          offset += bins;
          break;
        }
        case "hash": {
          const buckets = op.buckets ?? 32;
          const value = String(ev.payload?.[op.field] ?? ev.payload?.target ?? "");
          const h = murmurhash3(value, 42);
          const idx = h % buckets;
          if (offset + idx < this.dim) {
            this.output[offset + idx] = 1.0;
          }
          offset += buckets;
          break;
        }
        case "numeric": {
          const val = Number(ev.payload?.[op.field] ?? 0);
          // Normalize to [0,1] with simple sigmoid-like mapping
          const normalized = val / (1 + Math.abs(val));
          if (offset < this.dim) {
            this.output[offset] = normalized;
          }
          offset += 1;
          break;
        }
        case "clamp": {
          const raw = Number(ev.payload?.[op.field] ?? 0);
          const clamped = Math.max(op.min ?? 0, Math.min(op.max ?? 1, raw));
          if (offset < this.dim) {
            this.output[offset] = clamped;
          }
          offset += 1;
          break;
        }
        case "scale": {
          const rawVal = Number(ev.payload?.[op.field] ?? 0);
          if (offset < this.dim) {
            this.output[offset] = rawVal * (op.factor ?? 1);
          }
          offset += 1;
          break;
        }
      }
    }

    this.lastEventTime = now;
    return this.output;
  }

  getDim(): number {
    return this.dim;
  }
}
