import { env, pipeline, type AutomaticSpeechRecognitionPipeline, type PretrainedModelOptions } from "@huggingface/transformers";
env.allowLocalModels = false;
env.backends.onnx.wasm!.wasmPaths = "/speech/";
env.backends.onnx.wasm!.numThreads = 1;
const createTranscriber = pipeline as unknown as (task: "automatic-speech-recognition", model: string, options: PretrainedModelOptions) => Promise<AutomaticSpeechRecognitionPipeline>;
let transcriber: Promise<AutomaticSpeechRecognitionPipeline> | null = null;
let recognition: "careful" | "quick" = "careful";
async function getModel() {
  if (!transcriber) {
    const modelId = recognition === "quick" ? "onnx-community/moonshine-tiny-ONNX" : "onnx-community/moonshine-base-ONNX";
    transcriber = createTranscriber("automatic-speech-recognition", modelId, {
      device: "wasm", dtype: { encoder_model: "fp32", decoder_model_merged: "q8" },
      progress_callback: p => { if(p.status==="progress")self.postMessage({type:"progress",file:p.file,progress:p.progress}); },
    }).then(async model => {
      // Transformers.js 3.8.1 Moonshine decodes through the processor, which is
      // constructed without a tokenizer. Attach the pipeline's actual tokenizer.
      Object.assign(model.processor.components, {tokenizer:model.tokenizer});
      await model(new Float32Array(8000), {max_new_tokens:12,do_sample:false});
      return model;
    });
  }
  return transcriber;
}
let chain=Promise.resolve();
self.onmessage=(event:MessageEvent<{type:"load"|"transcribe";audio?:Float32Array;id?:number;recognition?:"careful"|"quick"}>)=>{
  const data=event.data;
  chain=chain.then(async()=>{
    try {
      if (data.type === "load" && !transcriber) recognition = data.recognition === "quick" ? "quick" : "careful";
      const model=await getModel();
      if(data.type==="load"){self.postMessage({type:"ready"});return;}
      if(!data.audio?.length)throw new Error("No speech was received.");
      const started=performance.now();
      const result=await model(data.audio,{max_new_tokens:12,do_sample:false});
      const output=Array.isArray(result)?result[0]:result;
      self.postMessage({type:"result",id:data.id,text:output.text,inferenceMs:Math.round(performance.now()-started)});
    }catch(error){
      transcriber=null;
      self.postMessage({type:"error",id:data.id,message:error instanceof Error?error.message:"Speech recognition could not start."});
    }
  });
};
