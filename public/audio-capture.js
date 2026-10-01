// Capture 20 ms PCM frames; keep output silent so microphone audio never plays back.
class LilyPadCapture extends AudioWorkletProcessor {
  constructor(){super();this.frame=new Float32Array(Math.round(sampleRate*.02));this.position=0;}
  process(inputs,outputs){
    for(const channel of outputs[0]??[])channel.fill(0);
    const channels=inputs[0];if(!channels?.length)return true;
    for(let i=0;i<channels[0].length;i++){
      let value=0;for(const channel of channels)value+=channel[i];
      this.frame[this.position++]=value/channels.length;
      if(this.position===this.frame.length){this.port.postMessage(this.frame,[this.frame.buffer]);this.frame=new Float32Array(Math.round(sampleRate*.02));this.position=0;}
    }
    return true;
  }
}
registerProcessor('lilypad-capture',LilyPadCapture);
