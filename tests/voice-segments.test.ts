import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceSegments, resample16k } from '../lib/voice-segments.ts';
const quiet=()=>new Float32Array(320);
const speech=()=>Float32Array.from({length:320},(_,i)=>Math.sin(i*.3)*.1);
test('silence never produces a transcription request',()=>{
  const segments=new VoiceSegments(16000);
  for(let i=0;i<1000;i++)assert.equal(segments.push(quiet()).audio,undefined);
});
test('a word completes after 320 ms of quiet, with leading audio preserved',()=>{
  const segments=new VoiceSegments(16000);
  for(let i=0;i<8;i++)segments.push(quiet());
  assert.equal(segments.push(speech()).started,true);
  for(let i=0;i<19;i++)segments.push(speech());
  for(let i=0;i<15;i++)assert.equal(segments.push(quiet()).audio,undefined);
  const result=segments.push(quiet()).audio;
  assert.ok(result);assert.equal(result.length,(8+20+16)*320);
  for(let i=0;i<30;i++)assert.equal(segments.push(quiet()).audio,undefined);
});
test('short noise clicks do not create word attempts',()=>{
  const segments=new VoiceSegments(16000);
  segments.push(speech());
  for(let i=0;i<25;i++)assert.equal(segments.push(quiet()).audio,undefined);
});
test('a quiet 300 ms starting consonant is preserved before the voiced vowel',()=>{
 const segments=new VoiceSegments(16000);
 for(let i=0;i<30;i++)segments.push(quiet());
 const consonant=Float32Array.from({length:320},(_,i)=>Math.sin(i*.7)*.002);
 for(let i=0;i<15;i++)assert.equal(segments.push(consonant).started,false);
 for(let i=0;i<10;i++)segments.push(speech());
 for(let i=0;i<15;i++)assert.equal(segments.push(quiet()).audio,undefined);
 const audio=segments.push(quiet()).audio!;
 assert.equal(audio.length,(18+10+16)*320);
 assert.deepEqual(audio.slice(3*320,18*320),Float32Array.from({length:15*320},(_,i)=>consonant[i%320]));
});
test('brief pauses within a word do not split the word',()=>{
  const segments=new VoiceSegments(16000);
  for(let i=0;i<10;i++)segments.push(speech());
  for(let i=0;i<8;i++)assert.equal(segments.push(quiet()).audio,undefined);
  for(let i=0;i<10;i++)segments.push(speech());
  for(let i=0;i<15;i++)assert.equal(segments.push(quiet()).audio,undefined);
  assert.ok(segments.push(quiet()).audio);
});
test('pause and hint reset discard partial audio before the next attempt',()=>{
  const segments=new VoiceSegments(16000);
  for(let i=0;i<20;i++)segments.push(speech());
  segments.reset();
  for(let i=0;i<25;i++)assert.equal(segments.push(quiet()).audio,undefined);
});
test('long utterances are bounded to four seconds',()=>{
  const segments=new VoiceSegments(16000);
  for(let i=0;i<199;i++)assert.equal(segments.push(speech()).audio,undefined);
  assert.equal(segments.push(speech()).audio?.length,64000);
});
test('resampling preserves duration and values from 48 kHz or 44.1 kHz',()=>{
  for(const rate of [48000,44100]){
    const result=resample16k(new Float32Array(rate).fill(.5),rate);
    assert.equal(result.length,16000);assert.equal(result[1000],.5);
  }
});
