import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('public/speech',{recursive:true});
await build({entryPoints:['lib/speech.worker.ts'],outfile:'public/speech/worker.js',bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022'});
for(const file of ['ort-wasm-simd-threaded.jsep.wasm','ort-wasm-simd-threaded.jsep.mjs']) await copyFile(`node_modules/@huggingface/transformers/dist/${file}`,`public/speech/${file}`);

import {readFile,writeFile} from 'node:fs/promises';
let notices='LilyPad browser speech dependencies\n\n';
for(const [label,file] of [['Transformers.js','node_modules/@huggingface/transformers/LICENSE'],['ONNX Runtime','licenses/onnxruntime.txt']]) {
  notices+=`${label}\n${await readFile(file,'utf8')}\n\n`;
}
await writeFile('public/speech/THIRD_PARTY_NOTICES.txt',notices);
