# Third-party notices

LiliPad's original source is GPL-3.0-only. This does not replace the licenses of third-party components. Preserve their notices when copying or distributing them. `package-lock.json` records the exact installed dependency versions; this table covers the main runtime components and bundled material rather than every transitive npm package.

| Component | License | Source / notices |
| --- | --- | --- |
| React | MIT | https://github.com/facebook/react |
| Vinext | MIT | https://github.com/cloudflare/vinext |
| Vite | MIT | https://github.com/vitejs/vite |
| Tailwind CSS | MIT | https://github.com/tailwindlabs/tailwindcss |
| Radix primitives | MIT | https://github.com/radix-ui/primitives |
| shadcn/ui | MIT | https://github.com/shadcn-ui/ui |
| Vendored shadcn Tailwind stylesheet | MIT | [Preserved notice](vendor/shadcn-tailwind-4.13.0.LICENSE.md) |
| Lucide icons | ISC | https://github.com/lucide-icons/lucide |
| Nunito font | SIL Open Font License 1.1 | https://github.com/googlefonts/nunito; Fontsource package includes its license |
| Transformers.js | Apache-2.0 | https://github.com/huggingface/transformers.js; installed package license is copied into generated speech notices |
| ONNX Runtime | MIT | [License](licenses/onnxruntime.txt), https://github.com/microsoft/onnxruntime |
| Moonshine models | MIT | https://huggingface.co/UsefulSensors/moonshine; ONNX versions: https://huggingface.co/onnx-community/moonshine-base-ONNX and https://huggingface.co/onnx-community/moonshine-tiny-ONNX |
| Kokoro 82M model | Apache-2.0 | https://huggingface.co/hexgrad/Kokoro-82M; ONNX version: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX |
| kokoro-js | Apache-2.0 | https://github.com/hexgrad/kokoro/tree/main/kokoro.js |
| Phonemizer.js wrapper | Apache-2.0 | https://github.com/xenova/phonemizer.js; [license text](licenses/apache-2.0.txt) |
| Embedded eSpeak NG | GPLv3 | [License](licenses/espeak-ng.txt), https://github.com/espeak-ng/espeak-ng; [source notes](docs/speech-sources.md) |
| CMUdict pronunciation subset | BSD-style | [Preserved copyright, conditions, and disclaimer](public/reading-library-notices.txt), https://github.com/cmusphinx/cmudict |
| Vendored Sites Vite plugin | MIT, © 2026 OpenAI | [Preserved notice](build/sites-vite-plugin.LICENSE) |

`npm run dev` and `npm run build` generate `public/speech/THIRD_PARTY_NOTICES.txt` with the full installed license texts for Transformers.js, ONNX Runtime, kokoro-js, the phonemizer wrapper, and eSpeak NG. That directory contains generated runtime artifacts and is not committed.

Model weights and voice files are downloaded at runtime rather than included in this repository. Keep upstream model terms when redistributing those files. Browser installation of npm packages does not change those terms.
