import { VoiceSegments } from "./voice-segments";

export class MicrophoneCapture {
  private enabled=false;
  private closed=false;
  private node: AudioWorkletNode | null=null;
  private source: MediaStreamAudioSourceNode | null=null;
  private segments: VoiceSegments;
  private constructor(private context:AudioContext,private stream:MediaStream,private onLost:()=>void){this.segments=new VoiceSegments(context.sampleRate);}
  static async open(onAudio:(audio:Float32Array)=>void,onSpeech:()=>void,onLost:()=>void):Promise<MicrophoneCapture> {
    if(!navigator.mediaDevices?.getUserMedia||!window.AudioWorkletNode)throw new Error("This browser can't listen continuously. Try Chrome or Edge, or turn on read-together mode.");
    const context=new AudioContext({sampleRate:16000});
    // Start both during the user gesture. Never wait for a model download before permission.
    const resumed=context.resume().then(()=>null,error=>error);
    let stream:MediaStream;
    try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1},video:false});}
    catch(error){await context.close();throw error;}
    const capture=new MicrophoneCapture(context,stream,onLost);
    try {
      const resumeError=await resumed;if(resumeError)throw resumeError;
      await context.audioWorklet.addModule("/audio-capture.js");
      capture.source=context.createMediaStreamSource(stream);
      capture.node=new AudioWorkletNode(context,"lilypad-capture",{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
      capture.node.port.onmessage=(event:MessageEvent<Float32Array>)=>{
        if(!capture.enabled||capture.closed)return;
        const segment=capture.segments.push(event.data);
        if(segment.started)onSpeech();
        if(segment.audio){capture.hold();onAudio(segment.audio);}
      };
      capture.node.onprocessorerror=()=>{if(!capture.closed)onLost();};
      for(const track of stream.getTracks())track.onended=()=>{if(!capture.closed)onLost();};
      context.onstatechange=()=>{if(!capture.closed&&capture.enabled&&context.state!=="running")onLost();};
      capture.source.connect(capture.node);capture.node.connect(context.destination);
      return capture;
    }catch(error){capture.close();throw error;}
  }
  hold(){this.enabled=false;this.segments.reset();}
  listen(){if(this.closed)return false;if(this.context.state!=="running"){this.onLost();return false;}this.segments.reset();this.enabled=true;return true;}
  close(){
    if(this.closed)return;
    this.closed=true;this.enabled=false;
    this.context.onstatechange=null;
    if(this.node){this.node.port.onmessage=null;this.node.disconnect();}
    this.source?.disconnect();
    for(const track of this.stream.getTracks()){track.onended=null;track.stop();}
    void this.context.close().catch(()=>{});
  }
}
