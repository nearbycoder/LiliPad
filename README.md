# LiliPad

A gentle reading practice app for Lili (short for Liliana), with a dashboard, three ten-word adventures, spoken hints, celebrations, and device-local progress.

## Run locally

Requires Node.js 22.13+ and npm.

```sh
npm install
npm run dev -- --port 4321
```

Open the URL printed by the server. Use `npm test` to check speech segmentation, matching, settings migration, and voice cancellation. Use `npm run typecheck` to check TypeScript and `npm run build` for the production build. The project uses React, Vinext, Tailwind, and the bundled shadcn/Radix UI primitives.

## Reading and speech

- Tap **Let's play Word Hop**, then **Start reading** once. Allow microphone access and read each displayed word. A 320 ms pause after speech triggers recognition automatically. Correct words advance after a 450 ms celebration, and the same microphone keeps listening. Incorrect words automatically accept another attempt. **Pause listening** stops the microphone; **Resume listening** starts it again. Switching away from the tab pauses the session.
- Open-source **[Moonshine base English](https://huggingface.co/onnx-community/moonshine-base-ONNX)** is the default Careful listening model (~123 MB of weights). Parent corner also offers **[Moonshine tiny English](https://huggingface.co/onnx-community/moonshine-tiny-ONNX)** for Quick listening (~51 MB). Both use an fp32 encoder and q8 decoder through Transformers.js 3.8.1 and single-thread ONNX Runtime Web in a dedicated browser worker. The worker and WASM runtime are hosted with the app; model files download from Hugging Face on first use and use the browser cache.
- AudioWorklet captures mono PCM directly and resamples it to 16 kHz when necessary. Short speech segments avoid Whisper's fixed-window processing and repeated recording/decoding overhead. The model loads and warms when the adventure opens, instead of reloading per word. The app does not upload or store recordings. Speech recognition is not a pronunciation or reading assessment, and children's voices can be misheard. Test with Lili on the intended device before treating feedback as reliable.
- Capture preserves 360 ms before the detected vowel to retain quiet starting consonants, including th, f, and s. Noise suppression is disabled to avoid removing those sounds; echo cancellation remains enabled. This does not increase the 320 ms wait after speech.
- Whole-word matching ignores casing and punctuation and explicitly supports selected homophones. It also accepts the exact carrier phrases “The word is …”, “It is …”, and “It's …”, followed by the matching word. This supplies optional context when single-word recognition struggles. It rejects partial words, negation, arbitrary sentences, and similar but different words: fin, Finn, tin, and then do not match thin. Recognition is never prompted with the expected answer.
- Hints temporarily suspend capture, discard any pending answer, and resume listening after playback. Silence and short noise clicks do not create word attempts. Pause, skip, close, and word changes invalidate stale transcripts so they cannot award stars.
- Hints use **[Kokoro 82M](https://huggingface.co/hexgrad/Kokoro-82M)** with its Heart voice (`af_heart`) by default, through kokoro-js 1.2.1 and the [ONNX q8 model](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX). About 93 MB of weights plus supporting files download on first use and cache in the browser. Generation runs locally in a separate WASM worker. Short word examples use punctuation, and hints explain sounds through familiar words and articulation rather than asking TTS to pronounce invented letter sounds. Audio clips are cached within the adventure, with a bounded memory budget. **Stop hint** cancels pending generation or playback and resumes listening. The natural voice preloads when the adventure opens.
- Parent corner offers **Try the reading voice** and an explicit **Device voice** option. Device voices vary; local English is preferred, but the browser may offer a network voice. If the natural model fails, the game offers a device-voice button. Written hints remain available.
- Microphone access requires HTTPS or localhost. A network connection is required for the first model download; browser model caches may be evicted. Modern Chrome or Edge is recommended; inference speed depends on the device.
- **Parent corner → Read together** lets a grown-up listen and mark a word as read. These records are labeled separately from speech-verified records.

## Verified performance

On the same 0.52-second spoken “cat” reference clip in the local test browser, after warmup, the old Whisper worker took 947 ms and Moonshine took 31 ms for inference. This is a measured example on the development machine, not a guarantee for every device. Endpoint detection and the 450 ms celebration are additional time. Browser tests also exercised automatic advancement across two words with one microphone acquisition, automatic retry, stopping tracks on pause, audio suppression during hints, and rejection of a pending correct result after a hint interrupts it.

The natural-voice update was verified with real Kokoro generation, persistent model/voice cache entries, and cached repeated audio. In the development Chromium browser, short examples took about 1.7–2.0 seconds to generate initially; a repeated clip returned from memory in 0 ms. Longer hints take longer. Actual audio through the microphone capture and recognizer rejected “The word is fin” for thin, accepted “The word is thin,” then accepted duck and advanced twice with one microphone acquisition. All 19 automated tests and TypeScript checks passed.

Isolated synthetic and [Wiktionary pronunciation recordings](https://en.wiktionary.org/wiki/thin) of thin, fin, and tin exposed recognition errors in both Moonshine sizes. Whisper tiny/base comparison workers also misheard these words and were slower, so they were not added to the app. Carrier phrases helped the synthetic examples but do not guarantee accuracy for a child's voice. This update has not been verified on Lili's iPad or with her recordings; do that before relying on reading feedback.

## iPad and touch layouts

Primary controls and navigation are at least 56 px tall; reading controls are 64 px tall, with space between targets. Adventure filters are 56 px tall on touch devices, and settings switches are 80 × 48 px. Portrait tablets and Split View use a navigation drawer below 1024 px; wider landscape layouts keep the sidebar. Reading panels scroll within the viewport, respect safe areas, and keep browser zoom available. No action requires hovering.

## Progress and settings

Progress and settings are stored under `lilypad.v1` in localStorage in the current browser. There are no accounts or cross-device synchronization. Clearing browser data removes progress. A star is awarded per completed word, including repeated practice; skipping words earns no star. Progress is saved after each success, so ending a round keeps completed words.

Customize word lists, blending chunks, hints, sentences, and accepted homophones in `lib/reading.ts`. Recognition cleanup, recording, and celebrations are in `components/reading-game.tsx`.

## Assets and licenses

`public/images/frog-reader.png` is an original image created with the built-in image generation tool. Prompt: “Original charming children's book flat gouache illustration of a friendly small green frog sitting on a lily pad reading an open cream book, with a pink water lily beside it and a tiny golden sparkle. Bold simple shapes, rounded forms, subtle paper texture. Moss green, teal, pale mint, peach cheeks. Square, isolated full composition on a transparent background. No text, letters, UI, or logos.”

Nunito is self-hosted through Fontsource (SIL Open Font License). Transformers.js, Moonshine, and ONNX Runtime are MIT licensed. Kokoro and its JavaScript library are Apache-2.0 licensed. Phonemizer.js has an Apache-2.0 wrapper and embeds eSpeak NG (GPLv3); its license and upstream source links are included in `public/speech/THIRD_PARTY_NOTICES.txt`. Review dependency licenses before redistribution.

Speech assets are generated by `scripts/prepare-speech.mjs` before development and production builds, rather than committed. Sites hosting identity is stored in `.openai/hosting.json`.
