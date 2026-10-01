/** Small energy-based endpointer. Sends actual speech, never empty/silent windows. */
export class VoiceSegments {
  private lead: Float32Array[] = [];
  private chunks: Float32Array[] = [];
  private started = false;
  private voicedMs = 0;
  private quietMs = 0;
  private lengthMs = 0;
  private noise = 0.001;
  private sampleRate: number;
  constructor(sampleRate: number) {this.sampleRate=sampleRate;}
  reset() {
    this.lead=[];this.chunks=[];this.started=false;
    this.voicedMs=0;this.quietMs=0;this.lengthMs=0;
  }
  push(frame: Float32Array): {started: boolean; audio?: Float32Array} {
    const ms=frame.length/this.sampleRate*1000;
    let energy=0;for(const value of frame)energy+=value*value;
    const rms=Math.sqrt(energy/frame.length);
    const threshold=Math.max(0.004,Math.min(0.018,this.noise*3.5));
    const voiced=rms>=threshold;
    if(!this.started&&!voiced) {
      this.noise=this.noise*.98+rms*.02;
      this.lead.push(frame);while(this.lead.length>Math.ceil(160/ms))this.lead.shift();
      return {started:false};
    }
    const justStarted=!this.started;
    if(justStarted){this.started=true;this.chunks=this.lead;this.lead=[];}
    this.chunks.push(frame);this.lengthMs+=ms;
    if(voiced){this.voicedMs+=ms;this.quietMs=0;}else this.quietMs+=ms;
    if(this.quietMs<320&&this.lengthMs<4000)return {started:justStarted};
    if(this.voicedMs<100){this.reset();return {started:false};}
    const size=this.chunks.reduce((n,c)=>n+c.length,0);
    const joined=new Float32Array(size);let offset=0;
    for(const chunk of this.chunks){joined.set(chunk,offset);offset+=chunk.length;}
    this.reset();
    return {started:justStarted,audio:resample16k(joined,this.sampleRate)};
  }
}

/** Linear interpolation also handles browsers that ignore the requested 16 kHz rate. */
export function resample16k(audio: Float32Array, sampleRate: number): Float32Array {
  if(sampleRate===16000)return audio;
  const result=new Float32Array(Math.round(audio.length*16000/sampleRate));
  const ratio=sampleRate/16000;
  for(let i=0;i<result.length;i++){
    const position=i*ratio;const left=Math.floor(position);const fraction=position-left;
    result[i]=audio[left]*(1-fraction)+(audio[Math.min(left+1,audio.length-1)]??0)*fraction;
  }
  return result;
}
