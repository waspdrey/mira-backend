export interface SessionData {
  id: string;
  connectionState: "idle" | "connecting" | "connected" | "disconnected" | "failed";
  transformEnabled: boolean;
  apiStatus: "unconfigured" | "ready" | "processing" | "error";
  latencyMs: number | null;
  referenceImageSet: boolean;
  referenceImageData?: string;
  lastOfferSdp?: string;
  createdAt: Date;
  updatedAt: Date;
}

class SessionStore {
  private sessions = new Map<string, SessionData>();

  getOrCreate(id: string): SessionData {
    if (!this.sessions.has(id)) {
      const session: SessionData = {
        id,
        connectionState: "idle",
        transformEnabled: false,
        apiStatus: Boolean(process.env["DECART_API_KEY"]) ? "ready" : "unconfigured",
        latencyMs: null,
        referenceImageSet: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.sessions.set(id, session);
    }
    return this.sessions.get(id)!;
  }

  get(id: string): SessionData | undefined {
    return this.sessions.get(id);
  }

  getAll(): SessionData[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  getLatest(): SessionData | undefined {
    const all = this.getAll();
    return all.length > 0 ? all[all.length - 1] : undefined;
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }
}

export const sessionStore = new SessionStore();
