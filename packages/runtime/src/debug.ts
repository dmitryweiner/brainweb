import { BwEvent, RecordEntry } from "./types";

export interface ContextSlotInfo {
  index: number;
  active: boolean;
  age: number;
  decayWeight: number;
  energy: number;
  target: string;
  eventType: string;
}

export interface EncoderOpRange {
  kind: string;
  field: string;
  offset: number;
  len: number;
}

export interface PipelineStep {
  name: string;
  durationMs: number;
}

export interface TickStats {
  fps: number;
  eventsPerSec: number;
  actionsPerSec: number;
  tickMs: number;
}

export interface WeightMatrixInfo {
  weights: number[];
  actions: string[];
  featureDim: number;
}

export interface GuardEffectRecord {
  t: number;
  action: string;
}

export interface DebugState {
  lastEvents: BwEvent[];
  contextTarget: string;
  contextEventType: string;
  actionValues: number[];
  actionProbs: number[];
  actionNames: string[];
  winner: string;
  guardRejection: string | null;
  featureVector: number[] | null;
  encoderOps: EncoderOpRange[];
  contextSlots: ContextSlotInfo[];
  guardHistory: GuardEffectRecord[];
  eventQueueLen: number;
  pipelineSteps: PipelineStep[];
  tickStats: TickStats;
  weightMatrix: WeightMatrixInfo | null;
}

export class DebugOverlay {
  private container: HTMLElement | null = null;
  private toggleBtn: HTMLElement | null = null;
  private enabled: boolean;
  private collapsed: Record<string, boolean> = {};
  private minimized = false;
  private lastRenderTime = 0;
  private readonly sections = ["events","queue","encoder","context","actions","weights","guards","pipeline"];
  private state: DebugState = {
    lastEvents: [],
    contextTarget: "",
    contextEventType: "",
    actionValues: [],
    actionProbs: [],
    actionNames: [],
    winner: "",
    guardRejection: null,
    featureVector: null,
    encoderOps: [],
    contextSlots: [],
    guardHistory: [],
    eventQueueLen: 0,
    pipelineSteps: [],
    tickStats: { fps: 0, eventsPerSec: 0, actionsPerSec: 0, tickMs: 0 },
    weightMatrix: null,
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
      position: fixed; bottom: 0; right: 0; width: 380px; max-height: 60vh;
      overflow-y: auto; background: rgba(15,15,25,0.95); color: #e0e0e0;
      font-family: 'SF Mono', Consolas, monospace; font-size: 11px;
      padding: 10px; z-index: 999999; border-top-left-radius: 8px;
      border-left: 1px solid rgba(100,100,255,0.3);
      border-top: 1px solid rgba(100,100,255,0.3);
      backdrop-filter: blur(8px); transition: opacity 0.2s;
    `;
    this.container.addEventListener("click", (e) => {
      let el = e.target as HTMLElement;
      while (el && el !== this.container) {
        if (el.dataset?.bwClose !== undefined) {
          this.setMinimized(true);
          return;
        }
        if (el.dataset?.bwFoldAll !== undefined) {
          this.toggleFoldAll();
          return;
        }
        if (el.dataset?.bwSection) {
          this.collapsed[el.dataset.bwSection] = !this.collapsed[el.dataset.bwSection];
          this.render();
          return;
        }
        el = el.parentElement as HTMLElement;
      }
    });
    const style = document.createElement("style");
    style.textContent = ".bw-sec-hdr{color:#99a;font-size:10px;font-weight:600;cursor:pointer;user-select:none;padding:4px 6px;margin:2px -6px;border-radius:4px}.bw-sec-hdr:hover{background:rgba(100,100,255,0.12)}";
    this.container.appendChild(style);
    document.body.appendChild(this.container);

    // Toggle button (shown when overlay is closed)
    this.toggleBtn = document.createElement("div");
    this.toggleBtn.id = "bw-debug-toggle";
    this.toggleBtn.style.cssText = `
      position: fixed; bottom: 12px; right: 12px; width: 36px; height: 36px;
      border-radius: 50%; background: rgba(15,15,25,0.9); color: #88f;
      font-family: 'SF Mono', Consolas, monospace; font-size: 11px; font-weight: bold;
      display: none; align-items: center; justify-content: center; cursor: pointer;
      z-index: 999999; border: 1px solid rgba(100,100,255,0.4);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4); transition: transform 0.2s; user-select: none;
    `;
    this.toggleBtn.textContent = "\u2699\uFE0F";
    this.toggleBtn.title = "Open BrainWeb Debug";
    this.toggleBtn.addEventListener("mouseenter", function(this: HTMLElement) { this.style.transform = "scale(1.1)"; });
    this.toggleBtn.addEventListener("mouseleave", function(this: HTMLElement) { this.style.transform = "scale(1)"; });
    this.toggleBtn.addEventListener("click", () => { this.setMinimized(false); });
    document.body.appendChild(this.toggleBtn);
    if (this.minimized) this.setMinimized(true);
  }

  private setMinimized(v: boolean): void {
    this.minimized = v;
    if (this.container) this.container.style.display = v ? "none" : "block";
    if (this.toggleBtn) this.toggleBtn.style.display = v ? "flex" : "none";
  }

  private toggleFoldAll(): void {
    const allFolded = this.sections.every(s => this.collapsed[s]);
    for (const s of this.sections) {
      this.collapsed[s] = !allFolded;
    }
    this.render();
  }

  update(state: Partial<DebugState>): void {
    Object.assign(this.state, state);
    if (!this.enabled || !this.container) return;
    const now = performance.now();
    if (now - this.lastRenderTime < 100) return;
    this.lastRenderTime = now;
    this.render();
  }

  private secHdr(id: string, label: string): string {
    const arrow = this.collapsed[id] ? "\u25b6" : "\u25bc";
    return `<div data-bw-section="${id}" class="bw-sec-hdr">${arrow}  ${label}</div>`;
  }

  private heatCell(val: number, mx: number): string {
    const t = mx > 0 ? Math.min(Math.abs(val) / mx, 1) : 0;
    const r = Math.round(20 + t * 60);
    const g = Math.round(20 + t * 100);
    const b = Math.round(40 + t * 215);
    return `<span style="display:inline-block;width:4px;height:10px;background:rgb(${r},${g},${b})" title="${val.toFixed(4)}"></span>`;
  }

  private weightCell(val: number): string {
    const t = Math.min(Math.abs(val) * 20, 1);
    let r: number, g: number, b: number;
    if (val < 0) { r = Math.round(40 + t * 200); g = Math.round(30 + t * 30); b = Math.round(30 + t * 30); }
    else { r = Math.round(30 + t * 30); g = Math.round(30 + t * 30); b = Math.round(40 + t * 200); }
    return `<span style="display:inline-block;width:4px;height:4px;background:rgb(${r},${g},${b})" title="${val.toFixed(5)}"></span>`;
  }

  private render(): void {
    if (!this.container) return;
    const s = this.state;
    let html = '';
    const ts = s.tickStats;

    // Header with stats and controls
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
    html += '<div style="color:#88f;font-weight:bold">BrainWeb Debug</div>';
    html += '<div style="display:flex;align-items:center;gap:8px">';
    html += '<span style="font-size:9px">';
    html += `<span style="color:#8f8">${ts.fps.toFixed(0)} fps</span> `;
    html += `<span style="color:#88f">${ts.eventsPerSec.toFixed(0)} ev/s</span> `;
    html += `<span style="color:#f8f">${ts.actionsPerSec.toFixed(0)} act/s</span>`;
    html += '</span>';
    const allFolded = this.sections.every(s => this.collapsed[s]);
    html += `<span data-bw-fold-all style="cursor:pointer;color:#666;font-size:9px;padding:2px 4px;border-radius:3px;border:1px solid #333;user-select:none" title="${allFolded ? 'Unfold all' : 'Fold all'}">${allFolded ? '\u25bc all' : '\u25b6 all'}</span>`;
    html += '<span data-bw-close style="cursor:pointer;color:#666;font-size:14px;line-height:1;padding:0 2px;user-select:none" title="Close debug panel">\u00d7</span>';
    html += '</div></div>';

    // EVENTS with full payload
    html += this.secHdr("events", "EVENTS");
    if (!this.collapsed["events"]) {
      if (s.lastEvents.length === 0) {
        html += '<div style="color:#555;margin-bottom:6px">none</div>';
      } else {
        html += '<div style="margin-bottom:6px">';
        const evs = s.lastEvents.slice(-5);
        for (const ev of evs) {
          html += `<div style="padding:1px 0;color:#8cf">${ev.sensor}.${ev.type}`;
          if (ev.payload) {
            const parts: string[] = [];
            for (const pk of Object.keys(ev.payload)) {
              let pv: string | number = ev.payload[pk];
              if (typeof pv === "number") pv = Math.round(pv * 100) / 100;
              parts.push(`<span style="color:#666">${pk}=</span><span style="color:#aaa">${pv}</span>`);
            }
            if (parts.length > 0) html += ` <span style="font-size:9px">${parts.join(" ")}</span>`;
          }
          html += '</div>';
        }
        html += '</div>';
      }
    }

    // EVENT QUEUE
    html += this.secHdr("queue", "EVENT QUEUE");
    if (!this.collapsed["queue"]) {
      const ql = s.eventQueueLen;
      const qbar = "\u2588".repeat(Math.min(ql, 30));
      html += `<div style="margin-bottom:6px;color:${ql > 0 ? "#ff8" : "#555"}">pending: ${ql} ${qbar}</div>`;
    }

    // ENCODER feature vector heatmap + ops
    html += this.secHdr("encoder", "ENCODER");
    if (!this.collapsed["encoder"]) {
      html += '<div style="margin-bottom:6px">';
      if (s.featureVector && s.featureVector.length > 0) {
        const fv = s.featureVector;
        let fvMax = 0;
        for (const v of fv) { if (Math.abs(v) > fvMax) fvMax = Math.abs(v); }
        html += `<div style="font-size:9px;color:#888;margin-bottom:2px">features [${fv.length}d] max=${fvMax.toFixed(3)}</div>`;
        html += '<div style="line-height:10px;letter-spacing:0">';
        for (const v of fv) html += this.heatCell(v, fvMax);
        html += '</div>';
        if (s.encoderOps.length > 0) {
          const opCols = ["#68f", "#f86", "#8f6", "#f6f", "#ff6", "#6ff"];
          html += '<div style="margin-top:3px;font-size:9px">';
          s.encoderOps.forEach((op, oi) => {
            const oc = opCols[oi % opCols.length];
            html += `<span style="color:${oc}">[${op.offset}-${op.offset + op.len - 1}] ${op.kind}`;
            if (op.field) html += `(${op.field})`;
            html += '</span> ';
          });
          html += '</div>';
        }
      } else {
        html += '<div style="color:#555">no features</div>';
      }
      html += '</div>';
    }

    // CONTEXT MEMORY
    html += this.secHdr("context", "CONTEXT MEMORY");
    if (!this.collapsed["context"]) {
      html += '<div style="margin-bottom:6px">';
      html += `<div>target: <span style="color:#cf8">${s.contextTarget || "\u2014"}</span></div>`;
      html += `<div>event: <span style="color:#cf8">${s.contextEventType || "\u2014"}</span></div>`;
      if (s.contextSlots.length > 0) {
        html += '<div style="margin-top:3px;font-size:9px;color:#888">slots:</div>';
        for (const cs of s.contextSlots) {
          if (!cs.active) {
            html += `<div style="color:#444;font-size:9px">[${cs.index}] empty</div>`;
          } else {
            const ageStr = cs.age < 1000 ? `${Math.round(cs.age)}ms` : `${(cs.age / 1000).toFixed(1)}s`;
            const wBar = "\u2588".repeat(Math.round(cs.decayWeight * 10));
            html += '<div style="font-size:9px">';
            html += `<span style="color:#68f">[${cs.index}]</span> `;
            html += `<span style="color:#aaa">age=${ageStr}</span> `;
            html += `<span style="color:#8f8">w=${cs.decayWeight.toFixed(2)} ${wBar}</span> `;
            html += `<span style="color:#888">E=${cs.energy.toFixed(3)}</span> `;
            if (cs.target) html += `<span style="color:#666">${cs.target.substring(0, 20)}</span>`;
            html += '</div>';
          }
        }
      }
      html += '</div>';
    }

    // ACTIONS with raw values
    html += this.secHdr("actions", "ACTIONS");
    if (!this.collapsed["actions"]) {
      html += '<div style="margin-bottom:6px">';
      if (s.actionNames.length === 0) {
        html += '<div style="color:#555">none</div>';
      } else {
        s.actionNames.forEach((aName, ai) => {
          const isW = aName === s.winner;
          const prob = s.actionProbs[ai] ?? 0;
          const rawV = s.actionValues[ai] ?? 0;
          const bar = "\u2588".repeat(Math.round(prob * 20));
          const st = isW ? "color:#5f5;font-weight:bold" : "color:#aaa";
          html += `<div style="${st}">${isW ? "\u25b8" : " "} ${aName}: ${prob.toFixed(3)} ${bar}`;
          html += ` <span style="color:#666;font-size:9px">raw=${rawV.toFixed(4)}</span></div>`;
        });
      }
      html += '</div>';
    }

    // WEIGHT MATRIX
    html += this.secHdr("weights", "WEIGHT MATRIX");
    if (!this.collapsed["weights"]) {
      html += '<div style="margin-bottom:6px">';
      if (s.weightMatrix) {
        const wm = s.weightMatrix;
        html += `<div style="font-size:9px;color:#888;margin-bottom:2px">${wm.actions.length} actions \u00d7 ${wm.featureDim} features</div>`;
        for (let wa = 0; wa < wm.actions.length; wa++) {
          html += '<div style="line-height:5px;margin-bottom:1px">';
          html += `<span style="font-size:8px;color:#888;display:inline-block;width:50px;overflow:hidden;text-overflow:ellipsis;vertical-align:top">${wm.actions[wa].substring(0, 7)}</span>`;
          const base = wa * wm.featureDim;
          for (let wf = 0; wf < wm.featureDim; wf++) {
            html += this.weightCell(wm.weights[base + wf]);
          }
          html += '</div>';
        }
      } else {
        html += '<div style="color:#555">no weights</div>';
      }
      html += '</div>';
    }

    // GUARDS
    html += this.secHdr("guards", "GUARDS");
    if (!this.collapsed["guards"]) {
      html += '<div style="margin-bottom:6px">';
      if (s.guardRejection) {
        html += `<div style="color:#f88;padding:2px 0">\u2298 ${s.guardRejection}</div>`;
      }
      if (s.guardHistory.length > 0) {
        html += '<div style="font-size:9px;color:#888;margin-top:2px">recent effects:</div>';
        const gh = s.guardHistory.slice(-8);
        const ghNow = performance.now();
        for (const ge of gh) {
          const gAge = ghNow - ge.t;
          const gAgeStr = gAge < 1000 ? `${Math.round(gAge)}ms` : `${(gAge / 1000).toFixed(1)}s`;
          html += `<div style="font-size:9px"><span style="color:#f86">${ge.action}</span> <span style="color:#666">${gAgeStr} ago</span></div>`;
        }
      } else if (!s.guardRejection) {
        html += '<div style="color:#555">no recent effects</div>';
      }
      html += '</div>';
    }

    // PIPELINE
    html += this.secHdr("pipeline", "PIPELINE");
    if (!this.collapsed["pipeline"]) {
      html += '<div style="margin-bottom:6px">';
      if (s.pipelineSteps.length > 0) {
        let maxDur = 0;
        for (const ps of s.pipelineSteps) { if (ps.durationMs > maxDur) maxDur = ps.durationMs; }
        for (const ps of s.pipelineSteps) {
          const pLen = maxDur > 0 ? Math.round((ps.durationMs / maxDur) * 15) : 0;
          const pbar = "\u2588".repeat(pLen);
          html += '<div style="font-size:9px">';
          html += `<span style="color:#68f;display:inline-block;width:55px">${ps.name}</span>`;
          html += `<span style="color:#aaa">${ps.durationMs.toFixed(2)}ms</span> `;
          html += `<span style="color:#446">${pbar}</span>`;
          html += '</div>';
        }
        html += `<div style="font-size:9px;color:#888;margin-top:1px">tick: ${ts.tickMs.toFixed(2)}ms</div>`;
      } else {
        html += '<div style="color:#555">no data</div>';
      }
      html += '</div>';
    }

    // Winner
    html += `<div style="margin-top:4px;color:#888;font-size:10px">Winner: <span style="color:#5f5;font-weight:bold">${s.winner || "\u2014"}</span></div>`;

    this.container.innerHTML = html;
  }

  destroy(): void {
    this.container?.remove();
    this.toggleBtn?.remove();
    this.container = null;
    this.toggleBtn = null;
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
