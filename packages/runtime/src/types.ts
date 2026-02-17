export interface BwEvent {
  sensor: string;
  type: string;
  t: number;
  payload: Record<string, any>;
}

export interface BwAppOpts {
  seed?: number;
  debug?: boolean;
  record?: boolean;
}

export interface RecordEntry {
  t: number;
  event?: BwEvent;
  winner?: string;
  guardRejected?: boolean;
}
