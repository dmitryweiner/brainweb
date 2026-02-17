import { BwEvent } from "./types";
import { EventQueue } from "./eventQueue";

export interface SensorConfig {
  name: string;
  eventTypes: string[];
}

function cssPath(el: Element | null): string {
  if (!el || el === document.body) return "body";
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== document.body) {
    let selector = cur.tagName.toLowerCase();
    if (cur.id) {
      selector += `#${cur.id}`;
      parts.unshift(selector);
      break;
    }
    if (cur.className && typeof cur.className === "string") {
      selector += "." + cur.className.trim().split(/\s+/).join(".");
    }
    parts.unshift(selector);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

function normalizePayload(ev: Event): Record<string, any> {
  const p: Record<string, any> = {};
  if (ev instanceof MouseEvent) {
    p.clientX = ev.clientX;
    p.clientY = ev.clientY;
    p.button = ev.button;
    p.target = cssPath(ev.target as Element);
  } else if (ev instanceof KeyboardEvent) {
    p.key = ev.key;
    p.code = ev.code;
    p.target = cssPath(ev.target as Element);
  } else if (ev instanceof InputEvent || (ev.target && "value" in (ev.target as any))) {
    const tgt = ev.target as HTMLInputElement;
    p.inputLen = tgt.value?.length ?? 0;
    p.target = cssPath(ev.target as Element);
  }
  if (ev.type === "scroll") {
    p.scrollY = window.scrollY;
    p.scrollX = window.scrollX;
  }
  return p;
}

const DOM_EVENT_MAP: Record<string, string> = {
  Click: "click",
  Input: "input",
  KeyDown: "keydown",
  KeyUp: "keyup",
  Scroll: "scroll",
  Focus: "focus",
  Blur: "blur",
  MouseMove: "mousemove",
  VisibilityChange: "visibilitychange",
};

export function wireSensors(
  configs: SensorConfig[],
  queue: EventQueue,
): () => void {
  const cleanups: (() => void)[] = [];

  for (const cfg of configs) {
    for (const evType of cfg.eventTypes) {
      const domEvent = DOM_EVENT_MAP[evType];
      if (!domEvent) continue;

      const target: EventTarget = (domEvent === "scroll" || domEvent === "visibilitychange")
        ? document
        : document;

      const handler = (ev: Event) => {
        queue.push({
          sensor: cfg.name,
          type: evType,
          t: performance.now(),
          payload: normalizePayload(ev),
        });
      };

      target.addEventListener(domEvent, handler, { passive: true });
      cleanups.push(() => target.removeEventListener(domEvent, handler));
    }
  }

  return () => cleanups.forEach(fn => fn());
}
