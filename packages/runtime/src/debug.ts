import { BwEvent, RecordEntry } from "./types";

export interface DebugState {
  lastEvents: BwEvent[];
  contextTarget: string;
  contextEventType: string;
  actionValues: number[];
  actionProbs: number[];
  actionNames: string[];
  winner: string;
  guardRejection: string | null;
}

export class DebugOverlay {
  private container: HTMLElement | null = null;
  private enabled: boolean;
  private state: DebugState = {
    lastEvents: [],
    contextTarget: "",
    contextEventType: "",
    actionValues: [],
    actionProbs: [],
    actionNames: [],
    winner: "",
    guardRejection: null,
  };

  constructor(enabled: boolean) {
    this.enabled = enabled;
    if (enabled && typeof document !== "undefined") {
      this.createOverlay();
    }
  }

  private createOverlay(): void {
    this.container = document.createElement("div");
    this.container.id = "bw-debug-overlay";
    this.container.style.cssText = `
      position: fixed; bottom: 0; right: 0; width: 360px; max-height: 50vh;
      overflow-y: auto; background: rgba(15,15,25,0.92); color: #e0e0e0;
      font-family: 'SF Mono', Consolas, monospace; font-size: 11px;
      padding: 10px; z-index: 999999; border-top-left-radius: 8px;
      border-left: 1px solid rgba(100,100,255,0.3);
      border-top: 1px solid rgba(100,100,255,0.3);
      backdrop-filter: blur(8px);
    `;
    document.body.appendChild(this.container);
  }

  update(state: Partial<DebugState>): void {
    Object.assign(this.state, state);
    if (!this.enabled || !this.container) return;
    this.render();
  }

  private render(): void {
    if (!this.container) return;
    const s = this.state;

    const eventsHtml = s.lastEvents.slice(-5).map(e =>
      `<div style="padding:1px 0;color:#8cf">${e.sensor}.${e.type} <span style="color:#666">${e.payload?.target ?? ""}</span></div>`
    ).join("");

    const actionsHtml = s.actionNames.map((name, i) => {
      const isWinner = name === s.winner;
      const bar = "█".repeat(Math.round((s.actionProbs[i] ?? 0) * 20));
      const style = isWinner ? "color:#5f5;font-weight:bold" : "color:#aaa";
      return `<div style="${style}">${isWinner ? "▸" : " "} ${name}: ${(s.actionProbs[i] ?? 0).toFixed(3)} ${bar}</div>`;
    }).join("");

    const guardHtml = s.guardRejection
      ? `<div style="color:#f88;padding:2px 0">⊘ ${s.guardRejection}</div>`
      : "";

    this.container.innerHTML = `
      <div style="color:#88f;font-weight:bold;margin-bottom:4px">BrainWeb Debug</div>
      <div style="margin-bottom:6px">
        <div style="color:#888;font-size:10px">EVENTS</div>
        ${eventsHtml || '<div style="color:#555">none</div>'}
      </div>
      <div style="margin-bottom:6px">
        <div style="color:#888;font-size:10px">CONTEXT</div>
        <div>target: <span style="color:#cf8">${s.contextTarget || "—"}</span></div>
        <div>event: <span style="color:#cf8">${s.contextEventType || "—"}</span></div>
      </div>
      <div style="margin-bottom:6px">
        <div style="color:#888;font-size:10px">ACTIONS</div>
        ${actionsHtml || '<div style="color:#555">none</div>'}
      </div>
      ${guardHtml}
      <div style="margin-top:4px;color:#888;font-size:10px">
        Winner: <span style="color:#5f5;font-weight:bold">${s.winner || "—"}</span>
      </div>
    `;
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}

export class Recorder {
  private entries: RecordEntry[] = [];
  private recording: boolean = false;

  start(): void {
    this.entries = [];
    this.recording = true;
  }

  stop(): RecordEntry[] {
    this.recording = false;
    return this.entries;
  }

  isRecording(): boolean {
    return this.recording;
  }

  recordEvent(event: BwEvent): void {
    if (!this.recording) return;
    this.entries.push({ t: event.t, event });
  }

  recordAction(t: number, winner: string, guardRejected: boolean): void {
    if (!this.recording) return;
    this.entries.push({ t, winner, guardRejected });
  }

  getEntries(): RecordEntry[] {
    return this.entries;
  }
}
