"use client";
import { useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { isSentenceMatch, sentenceTiles } from "@/lib/reading";

export function SentenceBuilder({ text, onBuilt }: { text: string; onBuilt: () => void }) {
  const tiles = useMemo(() => sentenceTiles(text), [text]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const selected = chosen.map(id => tiles.find(tile => tile.id === id)!);
  function check() {
    if (isSentenceMatch(selected.map(tile => tile.text).join(" "), text)) onBuilt();
    else setMessage("Try another order. Tap a word in your sentence to put it back.");
  }
  return <div className="sentence-builder">
    <h3>Build a sentence, then read it!</h3>
    <p>Tap the words in order. The capital letter and full stop can help.</p>
    <div className="sentence-slots" aria-label="Your sentence">
      {selected.length ? selected.map(tile => <button key={tile.id} aria-label={`Put ${tile.text} back`} onClick={() => { setChosen(ids => ids.filter(id => id !== tile.id)); setMessage(""); }}>{tile.text}</button>) : <span>Your sentence goes here.</span>}
    </div>
    <div className="sentence-bank" aria-label="Words to choose">
      {tiles.map(tile => <button key={tile.id} disabled={chosen.includes(tile.id)} onClick={() => { setChosen(ids => [...ids, tile.id]); setMessage(""); }}>{tile.text}</button>)}
    </div>
    <p className="builder-feedback" role="status">{message || `${chosen.length} of ${tiles.length} words in place`}</p>
    <div className="builder-actions"><button className="secondary-button" disabled={!chosen.length} onClick={() => { setChosen([]); setMessage(""); }}><RotateCcw size={18}/>Start over</button><button className="primary-button" disabled={chosen.length !== tiles.length} onClick={check}><Check size={18}/>Check my sentence</button></div>
  </div>;
}
