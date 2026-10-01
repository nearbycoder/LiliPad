"use client";
import { useEffect, useRef, useState } from "react";
import { Heart, Mic, ShieldCheck, Volume2, Users, LoaderCircle, Square } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { NaturalVoice, type VoiceState } from "@/lib/natural-voice";
import type { Settings } from "@/lib/reading";

export function ParentCorner({ settings, onChange, storageError }: { settings: Settings; onChange: (settings: Settings) => void; storageError: boolean }) {
  const voice = useRef<NaturalVoice | null>(null);
  const mounted = useRef(true);
  const previewEpoch = useRef(0);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>({ phase: "idle", progress: 0 });
  const [previewing, setPreviewing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  function stopPreview() {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewEpoch.current++;
    voice.current?.stop(); window.speechSynthesis?.cancel(); setPreviewing(false);
  }
  function previewVoice() {
    stopPreview();
    const epoch = previewEpoch.current;
    setPreviewing(true); setVoiceError("");
    const finish = (error = false) => {
      if (!mounted.current || epoch !== previewEpoch.current) return;
      if (previewTimer.current) clearTimeout(previewTimer.current);
      setPreviewing(false);
      if (error) setVoiceError("The voice couldn't play. Check your connection and try again, or choose the device voice.");
    };
    const text = "Hello, Lili. Let's read together. Thin. Think. Rest your tongue lightly between your teeth and gently blow air.";
    previewTimer.current = setTimeout(() => {
      if (epoch !== previewEpoch.current) return;
      stopPreview();
      setVoiceError("The voice is taking too long. Try again, or choose the device voice.");
    }, 180000);
    if (settings.voice === "natural") {
      voice.current ??= new NaturalVoice(setVoiceState);
      void voice.current.speak(text, .95).then(() => finish(), () => finish(true));
    } else {
      if (!("speechSynthesis" in window)) { finish(true); return; }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US"; utterance.rate = .95;
      utterance.voice = window.speechSynthesis.getVoices().find(v => v.lang === "en-US" && v.localService) ?? null;
      utterance.onend = () => finish(); utterance.onerror = () => finish(true);
      window.speechSynthesis.speak(utterance);
    }
  }
  useEffect(() => {
    mounted.current = true;
    const hidden = () => { if (document.hidden) stopPreview(); };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      mounted.current = false; previewEpoch.current++;
      if (previewTimer.current) clearTimeout(previewTimer.current);
      document.removeEventListener("visibilitychange", hidden);
      voice.current?.close(); voice.current = null; window.speechSynthesis?.cancel();
    };
  }, []);
  return <div className="parent-panel">
    <section className="parent-intro"><span className="parent-icon"><Heart size={28} /></span><h2>A little practice, a lot of patience.</h2><p>Start with a few comfortable words. Let Lili take her time, use a hint, and celebrate her effort. Five minutes together is a lovely place to begin.</p></section>
    <section className="settings-card">
      <h3>Make it feel right for Lili</h3>
      <fieldset className="speech-choice"><legend>Reading voice</legend><p>A friendly voice for word examples and spoken hints.</p><div>
        {([{ value: "natural", title: "Natural voice", detail: "A gentle voice downloaded once. About 93 MB, plus supporting files." }, { value: "device", title: "Device voice", detail: "Use this device's built-in voice without downloading a voice model." }] as const).map(option => <label key={option.value} className={settings.voice === option.value ? "selected" : ""}><input type="radio" name="reading-voice" value={option.value} checked={settings.voice === option.value} onChange={() => { stopPreview(); onChange({ ...settings, voice: option.value }); }} /><span><strong>{option.title}</strong><small>{option.detail}</small></span></label>)}
      </div></fieldset>
      <button className="secondary-button voice-preview" onClick={previewing ? stopPreview : previewVoice}>{previewing ? <Square size={18} /> : <Volume2 size={20} />}{previewing ? "Stop voice preview" : "Try the reading voice"}</button>
      {previewing && voiceState.phase === "loading" && <p className="voice-download" role="status"><LoaderCircle size={18} className="spin" />Getting the natural voice ready{voiceState.progress > 0 ? ` · current file ${voiceState.progress}%` : "..."}</p>}
      {voiceError && <p className="audio-error" role="status">{voiceError}</p>}
      <fieldset className="speech-choice"><legend>Listening helper</legend><p>Choose the larger model for difficult words, or the smaller model for older devices.</p><div>
        {([{ value: "careful", title: "Careful listening", detail: "Larger model for word recognition. About 123 MB, plus supporting files." }, { value: "quick", title: "Quick listening", detail: "Smaller, faster model. About 51 MB, plus supporting files." }] as const).map(option => <label key={option.value} className={settings.recognition === option.value ? "selected" : ""}><input type="radio" name="listening-helper" value={option.value} checked={settings.recognition === option.value} onChange={() => onChange({ ...settings, recognition: option.value })} /><span><strong>{option.title}</strong><small>{option.detail}</small></span></label>)}
      </div></fieldset>
      {[{ key: "assisted" as const, icon: Users, title: "Read together", description: "A grown-up listens and marks each word as read. Perfect for practicing without a microphone." }, { key: "sound" as const, icon: Volume2, title: "Celebration sounds", description: "Play a soft chime when Lili reads a word." }].map(({ key, icon: Icon, title, description }) => <div className="setting-row" key={key}><Icon size={22} /><div><label htmlFor={`setting-${key}`}>{title}</label><p>{description}</p></div><Switch id={`setting-${key}`} checked={settings[key]} onCheckedChange={checked => onChange({ ...settings, [key]: checked })} /></div>)}
    </section>
    <div className="parent-info-grid">
      <section><Mic size={23} /><h3>About the listening helper</h3><p>LiliPad uses the open-source Moonshine English models in your browser. Careful listening uses Moonshine base; Quick listening uses Moonshine tiny. On first use, the selected model downloads to this device.</p><p>Allow microphone access when asked. Tap “Start reading” once. Correct words move ahead automatically. Tap “Pause listening” to take a break.</p><p>Quiet starting sounds, such as the first sound in thin, are preserved before the vowel. Similar words are kept separate: fin, then, and tin are not matches for thin. If a single word is missed, try saying “The word is thin.” The app checks the final word in that exact phrase.</p><p>Speech recognition can still mishear children's voices. A “try again” means the app didn't hear a match. It is not an assessment of Lili's reading or pronunciation.</p></section>
      <section><ShieldCheck size={23} /><h3>Your family's learning space</h3><p>Recorded audio is processed on this device. LiliPad does not upload or save recordings. Word progress and preferences are saved in this browser only.</p><p>The natural voice uses the open-source Kokoro model and its Heart voice. It generates hints on this device. Model files and the voice are cached when browser storage is available; clearing or evicting that cache requires another download.</p><p>The device voice option uses your browser's speech voices; some devices provide network voices. Written hints always remain available.</p><p>Progress will not sync between devices. Clearing browser data will clear it. Word matches include a few common homophones, but do not check pronunciation quality.</p>{storageError && <p className="audio-error">This browser is blocking saved progress. Practice still works, but progress may be lost when you close the page.</p>}</section>
    </div>
  </div>;
}
