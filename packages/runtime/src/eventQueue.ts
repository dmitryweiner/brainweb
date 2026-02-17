import { BwEvent } from "./types";

export class EventQueue {
  private buf: BwEvent[] = [];

  push(event: BwEvent): void {
    this.buf.push(event);
  }

  drain(): BwEvent[] {
    if (this.buf.length === 0) return [];
    const events = this.buf;
    this.buf = [];
    return events;
  }

  get length(): number {
    return this.buf.length;
  }
}
