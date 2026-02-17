export interface GuardConfig {
  kind: string;
  limit?: number;
  windowMs?: number;
}

interface EffectRecord {
  t: number;
  action: string;
}

export class GuardChain {
  private configs: GuardConfig[];
  private recentEffects: EffectRecord[] = [];
  public lastRejection: string | null = null;

  constructor(configs: GuardConfig[]) {
    this.configs = configs;
  }

  check(action: string, now: number): boolean {
    this.lastRejection = null;

    for (const guard of this.configs) {
      switch (guard.kind) {
        case "max_effects_per_sec": {
          const limit = guard.limit ?? 10;
          const cutoff = now - 1000;
          const count = this.recentEffects.filter(e => e.t > cutoff).length;
          if (count >= limit) {
            this.lastRejection = `max_effects_per_sec (${count}/${limit})`;
            return false;
          }
          break;
        }
        case "suppress_repeats": {
          const windowMs = guard.windowMs ?? 1000;
          const cutoff = now - windowMs;
          const repeated = this.recentEffects.some(
            e => e.t > cutoff && e.action === action
          );
          if (repeated) {
            this.lastRejection = `suppress_repeats ("${action}" within ${windowMs}ms)`;
            return false;
          }
          break;
        }
      }
    }

    return true;
  }

  record(action: string, now: number): void {
    this.recentEffects.push({ t: now, action });
    // Keep only last 5 seconds of records
    const cutoff = now - 5000;
    while (this.recentEffects.length > 0 && this.recentEffects[0].t < cutoff) {
      this.recentEffects.shift();
    }
  }
}
