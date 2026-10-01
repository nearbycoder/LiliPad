import { KokoroTTS } from "kokoro-js";
import { env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.backends.onnx.wasm!.wasmPaths = "/speech/";
env.backends.onnx.wasm!.numThreads = 1;

let model: Promise<KokoroTTS> | null = null;
const clips = new Map<string, { audio: Float32Array; sampleRate: number }>();
let cachedSamples = 0;
async function getModel() {
  if (!model) {
    self.postMessage({ type: "loading" });
    model = KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
      dtype: "q8", device: "wasm",
      progress_callback: progress => {
        if (progress.status === "progress") self.postMessage({ type: "progress", progress: progress.progress });
      },
    }).then(async tts => {
      await tts.generate("Hello, Lili.", { voice: "af_heart", speed: .95 });
      self.postMessage({ type: "ready" });
      return tts;
    }).catch(error => { model = null; throw error; });
  }
  return model;
}
let chain = Promise.resolve();
self.onmessage = (event: MessageEvent<{ type: "load" | "generate"; id?: number; text?: string; speed?: number }>) => {
  const data = event.data;
  chain = chain.then(async () => {
    try {
      const tts = await getModel();
      if (data.type === "load") return;
      if (!data.text?.trim()) throw new Error("There is no hint to read.");
      const speed = Math.max(.8, Math.min(1.1, data.speed ?? .95));
      const key = `${speed}:${data.text}`;
      let clip = clips.get(key);
      const cached = !!clip;
      const started = performance.now();
      if (!clip) {
        const output = await tts.generate(data.text, { voice: "af_heart", speed });
        clip = { audio: new Float32Array(output.audio), sampleRate: output.sampling_rate };
        while (clips.size && (clips.size >= 32 || cachedSamples + clip.audio.length > 2_000_000)) {
          const oldest = clips.keys().next().value!;
          cachedSamples -= clips.get(oldest)!.audio.length; clips.delete(oldest);
        }
        if (clip.audio.length <= 2_000_000) { clips.set(key, clip); cachedSamples += clip.audio.length; }
      }
      const audio = clip.audio.slice();
      self.postMessage({ type: "audio", id: data.id, audio, sampleRate: clip.sampleRate, cached, inferenceMs: Math.round(performance.now() - started) }, { transfer: [audio.buffer] });
    } catch (error) {
      self.postMessage({ type: "error", id: data.id, message: error instanceof Error ? error.message : "The natural voice could not start." });
    }
  });
};
