# LiliPad

A gentle reading practice app for Lili (short for Liliana), with a dashboard, six reading adventures, spoken hints, celebrations, and device-local progress.

## Run locally

Requires Node.js 22.13+ and npm.

```sh
npm install
npm run dev -- --port 4321
```

Open the URL printed by the server. Use `npm test` to check speech segmentation, matching, settings migration, and voice cancellation. Use `npm run typecheck` to check TypeScript and `npm run build` for the production build. The project uses React, Vinext, Tailwind, and the bundled shadcn/Radix UI primitives.

## Reading and speech

- **Word Hop**, **Sound Safari**, and **Sight Word Stars** each have ten word rounds. **Sentence Pond** has eight short sentences, **Sentence Scramble** has six touch puzzles followed by spoken reading, and **Story Trail** has a connected six-sentence story. Find the new games under **Sentences & stories**.
- Sentence games accept the whole sentence aloud. They ignore casing and punctuation but require all words in order, rejecting missing, extra, substituted, or reordered words. A one-second pause ends a speech chunk; a correct opening phrase stays highlighted and can be continued after a longer pause. A fresh full sentence can restart a partial attempt. A mismatch, hint, pause, skip, or close clears the unfinished prefix. No star or record is awarded for a partial sentence. Capture is bounded to twelve seconds per chunk and the decoder allows up to 64 tokens for sentence mode.
- Sentence Scramble uses distinct touch tiles, including duplicate words. Tap words into order, tap a placed word to return it, and check the sentence. Building it does not earn a star; read it aloud afterward. Between puzzles, capture stays held until the next sentence is built; the same microphone then resumes. Sentence hints offer short spoken groups and a whole-sentence example.

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

The sentence update has 29 automated tests covering strict matching, reading pauses, fresh retries, sentence tiles, legacy progress, and segmentation limits, alongside the prior word/voice checks. Browser verification used real synthesized audio through AudioWorklet and Moonshine base. It rejected “The cat is under the mat,” “The cat on the mat,” and “The cat is not on the mat.” It accepted “The cat is” followed after a pause by “On the mat,” then accepted the next full sentence, with one microphone acquisition. Sentence Scramble rejected the wrong order, awarded no star for building alone, advanced after spoken reading, and ignored incoming audio while the next puzzle was unbuilt. Touch tiles were at least 64 × 64 px in the portrait-tablet test viewport. These are development-browser checks, not measurements of Lili's speech on iPad.

Isolated synthetic and [Wiktionary pronunciation recordings](https://en.wiktionary.org/wiki/thin) of thin, fin, and tin exposed recognition errors in both Moonshine sizes. Whisper tiny/base comparison workers also misheard these words and were slower, so they were not added to the app. Carrier phrases helped the synthetic examples but do not guarantee accuracy for a child's voice. This update has not been verified on Lili's iPad or with her recordings; do that before relying on reading feedback.

## iPad and touch layouts

Primary controls and navigation are at least 56 px tall; reading controls are 64 px tall, with space between targets. Adventure filters are 56 px tall on touch devices, and settings switches are 80 × 48 px. Portrait tablets and Split View use a navigation drawer below 1024 px; wider landscape layouts keep the sidebar. Reading panels scroll within the viewport, respect safe areas, and keep browser zoom available. No action requires hovering.

## Progress and settings

Progress and settings are stored under `lilypad.v1` in localStorage in the current browser. There are no accounts or cross-device synchronization. Clearing browser data removes progress. A star is awarded per completed word or whole sentence, including repeated practice; skipping earns no star. Sentence records store `kind: "sentence"` and the full text in the existing `word` field. Legacy word records remain valid. Word totals and the daily goal count every word in a completed sentence, while stars count completed rounds. Progress lists both practiced words and completed sentences and retains the read-together/source label. Progress is saved after each success, so ending a round keeps completed reading.

Customize word lists, blending chunks, hints, sentences, and accepted homophones in `lib/reading.ts`. Recognition cleanup, recording, and celebrations are in `components/reading-game.tsx`.

## Assets and licenses

`public/images/frog-reader.png` is an original image created with the built-in image generation tool. Prompt: “Original charming children's book flat gouache illustration of a friendly small green frog sitting on a lily pad reading an open cream book, with a pink water lily beside it and a tiny golden sparkle. Bold simple shapes, rounded forms, subtle paper texture. Moss green, teal, pale mint, peach cheeks. Square, isolated full composition on a transparent background. No text, letters, UI, or logos.”

Nunito is self-hosted through Fontsource (SIL Open Font License). Transformers.js, Moonshine, and ONNX Runtime are MIT licensed. Kokoro and its JavaScript library are Apache-2.0 licensed. Phonemizer.js has an Apache-2.0 wrapper and embeds eSpeak NG (GPLv3); its license and upstream source links are included in `public/speech/THIRD_PARTY_NOTICES.txt`. Review dependency licenses before redistribution.

Speech assets are generated by `scripts/prepare-speech.mjs` before development and production builds, rather than committed. Sites hosting identity is stored in `.openai/hosting.json`.

### Expanded practice libraries

Word Hop, Sound Safari, and Sight Word Stars each contain 600 unique words. Sentence Pond and Sentence Scramble each contain 600 unique sentences. Story Trail contains 101 connected stories of six sentences each (606 sentence entries). The original opening items are preserved. Additional sentences and stories use authored templates with recurring vocabulary and patterns. Word banks are curated practice material, not standardized Fry/Dolch lists or a claim of grade-level suitability for every item.

Rounds stay short: 10 words, 8 pond sentences, 6 scramble sentences, or the remainder of one story. Each activity saves its next library position in the existing `lilypad.v1` browser record. Completion and skips advance the cursor; skipped items earn no stars. Finishing the library loops to its beginning for review. Older records migrate to the item after the most recent completion in each activity.

Additional word hints use a subset of the open-source CMU pronunciation dictionary for initial sounds and single-vowel examples; words with ambiguous pronunciations use whole-word hints. The dictionary data and BSD license attribution are in `public/reading-library-notices.txt`. No remote vocabulary service is called during practice.
