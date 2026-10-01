export type VoiceState = { phase: "idle" | "loading" | "ready" | "error"; progress: number };
type Clip = { audio: Float32Array; sampleRate: number };

/** One background voice per open adventure. Audio playback starts from the tap gesture. */
export class NaturalVoice {
  private worker: Worker | null = null;
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private sequence = 0;
  private pending: { id: number; resolve: (clip: Clip) => void; reject: (error: Error) => void } | null = null;
  private playbackDone: (() => void) | null = null;
  private closed = false;
  private onState: (state: VoiceState) => void;
  constructor(onState: (state: VoiceState) => void) { this.onState = onState; }
  private update(state: VoiceState) { if (!this.closed) this.onState(state); }
  prepare() {
    if (this.closed || this.worker) return;
    this.update({ phase: "loading", progress: 0 });
    const worker = new Worker("/speech/voice-worker.js", { type: "module" });
    this.worker = worker;
    const failed = (message: string) => {
      if (this.closed || worker !== this.worker) return;
      this.pending?.reject(new Error(message)); this.pending = null;
      worker.terminate(); if (this.worker === worker) this.worker = null;
      this.update({ phase: "error", progress: 0 });
    };
    worker.onerror = () => failed("The natural voice could not load.");
    worker.onmessage = event => {
      if (this.closed || worker !== this.worker) return;
      const data = event.data;
      if (data.type === "loading") this.update({ phase: "loading", progress: 0 });
      if (data.type === "progress") this.update({ phase: "loading", progress: Math.round(data.progress) });
      if (data.type === "ready") this.update({ phase: "ready", progress: 100 });
      if (data.type === "audio" && this.pending && this.pending.id === data.id) {
        const pending = this.pending; this.pending = null;
        pending.resolve({ audio: data.audio, sampleRate: data.sampleRate });
      }
      if (data.type === "error") failed(data.message);
    };
    worker.postMessage({ type: "load" });
  }
  async speak(text: string, speed: number) {
    this.stop();
    const id = ++this.sequence;
    if (this.closed) throw new Error("The reading voice is closed.");
    // Resume synchronously from the tap, before awaiting model generation (Safari).
    this.context ??= new AudioContext();
    const resumed = this.context.resume();
    this.prepare();
    const clipPromise = new Promise<Clip>((resolve, reject) => {
      this.pending = { id, resolve, reject };
      this.worker?.postMessage({ type: "generate", id, text, speed });
    });
    const [, clip] = await Promise.all([resumed, clipPromise]);
    if (this.closed || id !== this.sequence) throw new DOMException("Hint cancelled", "AbortError");
    const buffer = this.context.createBuffer(1, clip.audio.length, clip.sampleRate);
    buffer.copyToChannel(new Float32Array(clip.audio), 0);
    const source = this.context.createBufferSource(); this.source = source;
    source.buffer = buffer; source.connect(this.context.destination);
    await new Promise<void>(resolve => {
      this.playbackDone = resolve;
      source.onended = () => {
        source.disconnect();
        if (this.source === source) { this.source = null; this.playbackDone = null; }
        resolve();
      };
      source.start();
    });
  }
  stop() {
    this.sequence++;
    this.pending?.reject(new DOMException("Hint cancelled", "AbortError")); this.pending = null;
    if (this.source) { this.source.onended = null; this.source.stop(); this.source.disconnect(); this.source = null; }
    this.playbackDone?.(); this.playbackDone = null;
  }
  close() {
    this.closed = true; this.stop();
    this.worker?.terminate(); this.worker = null;
    void this.context?.close().catch(() => {}); this.context = null;
  }
}
