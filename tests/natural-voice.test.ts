import test from 'node:test';
import assert from 'node:assert/strict';
import { NaturalVoice } from '../lib/natural-voice.ts';

class FakeWorker {
  static latest: FakeWorker;
  onmessage: ((event: {data: unknown}) => void) | null = null;
  onerror: (() => void) | null = null;
  requests: Array<{type: string; id?: number}> = [];
  terminated = false;
  constructor() { FakeWorker.latest = this; }
  postMessage(data: {type: string; id?: number}) { this.requests.push(data); }
  terminate() { this.terminated = true; }
  emit(data: unknown) { this.onmessage?.({data}); }
}
class FakeContext {
  static starts = 0;
  static resumes = 0;
  static stopped = 0;
  destination = {};
  resume() { FakeContext.resumes++; return Promise.resolve(); }
  close() { return Promise.resolve(); }
  createBuffer() { return {copyToChannel() {}}; }
  createBufferSource() {
    return {buffer: null, onended: null as (() => void) | null, connect() {}, disconnect() {}, start() {FakeContext.starts++;}, stop() {FakeContext.stopped++;}};
  }
}
globalThis.Worker = FakeWorker as unknown as typeof Worker;
globalThis.AudioContext = FakeContext as unknown as typeof AudioContext;
const clip = (id: number) => ({type:'audio',id,audio:new Float32Array(240),sampleRate:24000});

test('cancelling pending synthesis prevents late audio from playing',async()=>{
 const voice=new NaturalVoice(()=>{});
 const playing=voice.speak('thin',.85);
 const rejected=assert.rejects(playing,{name:'AbortError'});
 const worker=FakeWorker.latest;
 const id=worker.requests.find(r=>r.type==='generate')!.id!;
 voice.stop();worker.emit(clip(id));await rejected;
 assert.equal(FakeContext.starts,0);voice.close();
});
test('closing while loading terminates the worker and ignores later results',async()=>{
 const voice=new NaturalVoice(()=>{});
 const playing=voice.speak('thin',.85);
 const rejected=assert.rejects(playing,{name:'AbortError'});
 const worker=FakeWorker.latest;
 const id=worker.requests.find(r=>r.type==='generate')!.id!;
 voice.close();worker.emit(clip(id));await rejected;
 assert.equal(worker.terminated,true);assert.equal(FakeContext.starts,0);
});
test('stopping active playback completes its promise and stops the source',async()=>{
 const voice=new NaturalVoice(()=>{});
 const playing=voice.speak('thin',.85);
 const worker=FakeWorker.latest;
 worker.emit(clip(worker.requests.find(r=>r.type==='generate')!.id!));
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(FakeContext.starts,1);assert.ok(FakeContext.resumes>=3);
 voice.stop();await playing;assert.equal(FakeContext.stopped,1);voice.close();
});
test('failed loading rejects the hint and permits a new worker on retry',async()=>{
 const voice=new NaturalVoice(()=>{});
 const playing=voice.speak('cat',.85);
 const rejected=assert.rejects(playing,/could not load/);
 const old=FakeWorker.latest;old.onerror?.();await rejected;
 assert.equal(old.terminated,true);voice.prepare();assert.notEqual(FakeWorker.latest,old);voice.close();
});
