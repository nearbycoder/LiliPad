# Speech dependency sources

The natural voice uses `kokoro-js` 1.2.1 and its `phonemizer` 1.2.1 dependency, as recorded in `package-lock.json`. The wrapper is Apache-2.0; the embedded eSpeak NG program is GPLv3. LiliPad has not modified these dependencies.

## Pinned wrapper source

Phonemizer.js 1.2.1 corresponds to upstream commit `6835144b7ee9043129222549c1ed2f6a27216278` (commit message: “Update to v1.2.1”).

- [Source tree](https://github.com/xenova/phonemizer.js/tree/6835144b7ee9043129222549c1ed2f6a27216278)
- [Source archive](https://github.com/xenova/phonemizer.js/archive/6835144b7ee9043129222549c1ed2f6a27216278.tar.gz)
- [Bundled eSpeak worker](https://github.com/xenova/phonemizer.js/blob/6835144b7ee9043129222549c1ed2f6a27216278/src/espeakng.worker.js)
- [Wrapper build configuration](https://github.com/xenova/phonemizer.js/blob/6835144b7ee9043129222549c1ed2f6a27216278/rollup.config.js)
- [eSpeak NG upstream C/C++ source](https://github.com/espeak-ng/espeak-ng)

## Distribution scope

This Git repository contains LiliPad's source and build scripts, not `node_modules/`, generated `public/speech/` bundles, model weights, or recordings. Installation retrieves pinned npm packages; builds generate speech workers and copy the WASM runtime and dependency license notices.

Making this source repository public and licensing its original code under GPL-3.0 does not, by itself, establish complete corresponding-source provenance for every embedded dependency. The phonemizer repository contains a prebuilt eSpeak worker, and its published source does not identify the exact eSpeak NG revision and toolchain used to build that embedded program. An unpinned eSpeak homepage is not a substitute for corresponding source.

Before redistributing generated natural-voice bundles or packaging them in a native application, obtain and preserve the exact eSpeak source revision, local changes, data, and build instructions corresponding to the embedded binary, or rebuild the component from documented source. Preserve the GPL license and provide equivalent access to that corresponding source alongside the binaries. This provenance has not been independently verified for the current upstream package.

The repository license and notices are not a claim that an App Store package or every downstream distribution satisfies its separate requirements.
