export interface OutputFrame {
  jpeg: Buffer;
  updatedAt: number;
}

class OutputStreamStore {
  private latestFrame: OutputFrame | null = null;

  setFrame(jpeg: Buffer): void {
    this.latestFrame = {
      jpeg,
      updatedAt: Date.now(),
    };
  }

  getFrame(): OutputFrame | null {
    return this.latestFrame;
  }
}

export const outputStreamStore = new OutputStreamStore();
