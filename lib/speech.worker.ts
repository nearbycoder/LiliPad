import { env, pipeline, type AutomaticSpeechRecognitionPipeline, type PretrainedModelOptions } from "@huggingface/transformers";
env.allowLocalModels = false;
env.backends.onnx.wasm!.wasmPaths = "/speech/";
env.backends.onnx.wasm!.numThreads = 1;
const createTranscriber = pipeline as unknown as (task: "automatic-speech-recognition", model: string, options: PretrainedModelOptions) => Promise<AutomaticSpeechRecognitionPipeline>;
let transcriber: Promise<AutomaticSpeechRecognitionPipeline> | null = null;
self.onmessage = async (event: MessageEvent<{type: "load" | "transcribe"; audio?: Float32Array}>) => {
  try {
    if (!transcriber) {
      transcriber = createTranscriber("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
        dtype: "q8", device: "wasm",
        progress_callback: (p) => {if(p.status === "progress") self.postMessage({type:"progress",file:p.file,progress:p.progress});},
      }) as Promise<AutomaticSpeechRecognitionPipeline>;
    }
    const model = await transcriber;
    if(event.data.type === "load") { self.postMessage({type:"ready"}); return; }
    if(!event.data.audio?.length) throw new Error("No recording was received.");
    const result = await model(event.data.audio, {max_new_tokens:32,do_sample:false});
    const output = Array.isArray(result) ? result[0] : result;
    self.postMessage({type:"result",text:output.text});
  } catch(error) {
    transcriber = null;
    self.postMessage({type:"error",message:error instanceof Error ? error.message : "Speech recognition could not start."});
  }
};
