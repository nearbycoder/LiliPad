import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('public/speech',{recursive:true});
await build({entryPoints:['lib/speech.worker.ts'],outfile:'public/speech/worker.js',bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022'});
await build({entryPoints:['lib/voice.worker.ts'],outfile:'public/speech/voice-worker.js',bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022'});
for(const file of ['ort-wasm-simd-threaded.jsep.wasm','ort-wasm-simd-threaded.jsep.mjs']) await copyFile(`node_modules/@huggingface/transformers/dist/${file}`,`public/speech/${file}`);

import {readFile,writeFile} from 'node:fs/promises';
let notices='LiliPad browser speech dependencies\n\n';
for(const [label,file] of [['Transformers.js','node_modules/@huggingface/transformers/LICENSE'],['ONNX Runtime','licenses/onnxruntime.txt'],['Kokoro.js','node_modules/kokoro-js/LICENSE'],['Phonemizer.js wrapper','node_modules/phonemizer/LICENSE'],['eSpeak NG (embedded in Phonemizer.js)','licenses/espeak-ng.txt']]) {
  notices+=`${label}\n${await readFile(file,'utf8')}\n\n`;
}
notices+='Upstream source: https://github.com/xenova/phonemizer.js and https://github.com/espeak-ng/espeak-ng\nModel sources: https://huggingface.co/hexgrad/Kokoro-82M (Apache-2.0), https://huggingface.co/UsefulSensors/moonshine (MIT)\n';
await writeFile('public/speech/THIRD_PARTY_NOTICES.txt',notices);
