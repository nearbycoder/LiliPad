"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2, Lightbulb, Star, Sparkles, Check, RotateCcw, Heart, LoaderCircle, SkipForward } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { isWordMatch, wordSets, type ReadingRecord, type Settings } from "@/lib/reading";

type Status = "idle" | "loading" | "recording" | "checking" | "correct" | "retry" | "error";
export function ReadingGame({activity,onClose,onRead,settings}:{activity:string;onClose:()=>void;onRead:(record:ReadingRecord)=>void;settings:Settings}) {
  const words=wordSets[activity];
  const [index,setIndex]=useState(0);
  const [status,setStatus]=useState<Status>("idle");
  const [message,setMessage]=useState("");
  const [hint,setHint]=useState(false);
  const [download,setDownload]=useState(0);
  const [score,setScore]=useState(0);
  const [ttsError,setTtsError]=useState("");
  const [speaking,setSpeaking]=useState(false);
  const worker=useRef<Worker|null>(null);
  const loaded=useRef(false);
  const active=useRef(true);
  const recorder=useRef<MediaRecorder|null>(null);
  const stream=useRef<MediaStream|null>(null);
  const stopTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const advanceTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const modelTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const current=useRef({index,status});current.current={index,status};
  const onReadRef=useRef(onRead);onReadRef.current=onRead;
  const word=words[Math.min(index,words.length-1)];
  const finished=index>=words.length;
  const busy=["loading","recording","checking"].includes(status);
  const cleanupMic=useCallback(()=>{if(stopTimer.current)clearTimeout(stopTimer.current);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;},[]);
  const next=useCallback(()=>{if(advanceTimer.current)clearTimeout(advanceTimer.current);window.speechSynthesis?.cancel();setSpeaking(false);setIndex(i=>i+1);setStatus("idle");setMessage("");setHint(false);setTtsError("");},[]);
  const celebrate=useCallback((source:ReadingRecord["source"])=>{
    if(current.current.status==="correct")return;
    current.current.status="correct";setStatus("correct");setMessage("You got it! One happy hop.");setScore(s=>s+1);
    onReadRef.current({word:words[current.current.index].text,activity,at:new Date().toISOString(),source});
    if(settings.autoNext)advanceTimer.current=setTimeout(next,2200);
  },[words,activity,settings.autoNext,next]);
  const celebrateRef=useRef(celebrate);celebrateRef.current=celebrate;

  useEffect(()=>{
    active.current=true;
    return()=>{active.current=false;worker.current?.terminate();if(recorder.current?.state==="recording")recorder.current.stop();cleanupMic();if(advanceTimer.current)clearTimeout(advanceTimer.current);if(modelTimer.current)clearTimeout(modelTimer.current);window.speechSynthesis?.cancel();};
  },[cleanupMic]);

  const speak=(text:string,rate=.75)=>{
    if(busy||status==="correct")return;
    if(!("speechSynthesis" in window)){setTtsError("Your browser cannot play spoken hints. You can read the hint together.");return;}
    window.speechSynthesis.cancel();setTtsError("");setSpeaking(true);
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang="en-US";utterance.rate=rate;
    const voice=window.speechSynthesis.getVoices().find(v=>v.lang==="en-US"&&v.localService)??window.speechSynthesis.getVoices().find(v=>v.lang.startsWith("en"));if(voice)utterance.voice=voice;
    utterance.onend=()=>{if(active.current)setSpeaking(false);};
    utterance.onerror=()=>{if(active.current){setSpeaking(false);setTtsError("The spoken hint couldn't play. Try again, or read the hint together.");}};
    window.speechSynthesis.speak(utterance);
  };

  const beginRecording=async()=>{
    if(!active.current)return;
    try {
      if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==="undefined")throw new Error("This browser can't record audio. Try Chrome or Edge, or turn on read-together mode in Parent corner.");
      const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      if(!active.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;
      const recording=new MediaRecorder(media);recorder.current=recording;
      const chunks:BlobPart[]=[];
      recording.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recording.onerror=()=>{cleanupMic();if(active.current){setStatus("error");setMessage("The recording stopped unexpectedly. Please try again.");}};
      recording.onstop=async()=>{
        cleanupMic();if(!active.current)return;
        setStatus("checking");setMessage("Listening to your word...");
        let context:AudioContext|null=null;
        try {
          context=new AudioContext();const buffer=await context.decodeAudioData(await new Blob(chunks,{type:recording.mimeType}).arrayBuffer());
          if(buffer.duration<.35)throw new Error("That was a little too quick. Tap the mic and say the word again.");
          const offline=new OfflineAudioContext(1,Math.ceil(buffer.duration*16000),16000);
          const source=offline.createBufferSource();source.buffer=buffer;source.connect(offline.destination);source.start();
          const audio=(await offline.startRendering()).getChannelData(0);
          const rms=Math.sqrt(audio.reduce((sum,n)=>sum+n*n,0)/audio.length);
          if(rms<.003)throw new Error("I couldn't hear you that time. Move a little closer and try again.");
          if(!active.current)return;
          worker.current?.postMessage({type:"transcribe",audio},[audio.buffer]);
          modelTimer.current=setTimeout(()=>{if(active.current){worker.current?.terminate();worker.current=null;loaded.current=false;setStatus("error");setMessage("Listening is taking too long. Try again or read together with a grown-up.");}},90000);
        }catch(e){if(active.current){setStatus("error");setMessage(e instanceof Error?e.message:"I couldn't hear that recording. Please try again.");}}
        finally{await context?.close();}
      };
      window.speechSynthesis?.cancel();setSpeaking(false);setStatus("recording");setMessage("Say the word, then tap the stop button.");recording.start();
      stopTimer.current=setTimeout(()=>{if(recording.state==="recording")recording.stop();},6000);
    }catch(e){cleanupMic();if(!active.current)return;setStatus("error");setMessage(e instanceof DOMException&&e.name==="NotAllowedError"?"The microphone needs permission. Allow it in your browser, or ask a grown-up to turn on read-together mode.":e instanceof DOMException&&e.name==="NotFoundError"?"No microphone was found. Connect one, or try read-together mode.":e instanceof Error?e.message:"The microphone couldn't start. Please try again.");}
  };
  const beginRef=useRef(beginRecording);beginRef.current=beginRecording;
  const listen=()=>{
    if(status==="recording"){if(recorder.current?.state==="recording")recorder.current.stop();return;}
    if(busy||speaking||status==="correct"||finished)return;
    setHint(false);setTtsError("");
    if(loaded.current){void beginRecording();return;}
    setStatus("loading");setMessage("Getting your listening helper ready. The first visit takes a little longer.");setDownload(0);
    try {
      worker.current?.terminate();
      const w=new Worker("/speech/worker.js",{type:"module"});worker.current=w;
      const fail=()=>{if(modelTimer.current)clearTimeout(modelTimer.current);w.terminate();worker.current=null;loaded.current=false;if(active.current){setStatus("error");setMessage("Your listening helper couldn't load. Check your connection and try again, or use read-together mode.");}};
      w.onerror=fail;
      w.onmessage=(event)=>{
        if(!active.current)return;
        const data=event.data;
        if(data.type==="progress")setDownload(Math.round(data.progress));
        if(data.type==="ready"){if(modelTimer.current)clearTimeout(modelTimer.current);loaded.current=true;void beginRef.current();}
        if(data.type==="result"){
          if(modelTimer.current)clearTimeout(modelTimer.current);
          if(isWordMatch(data.text,words[current.current.index]))celebrateRef.current("speech");
          else {setStatus("retry");setMessage(data.text.trim()?`I heard “${data.text.trim()}”. Let's give this word another try!`:"I couldn't catch your word. Let's give it another try!");setHint(true);}
        }
        if(data.type==="error")fail();
      };
      w.postMessage({type:"load"});
      modelTimer.current=setTimeout(fail,180000);
    }catch{setStatus("error");setMessage("Your browser couldn't start the listening helper. Try another browser or read together with a grown-up.");}
  };

  return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="reading-dialog" showCloseButton><div className="game-top"><span className="small-pill"><BookIcon activity={activity}/>{activity.toUpperCase()}</span><span><Star size={16} fill="currentColor"/>{score} stars</span></div><DialogTitle className="game-heading">{finished?"Look at you, little reader!":"One word. One happy hop."}</DialogTitle><DialogDescription className="game-description">{finished?"You showed up, gave it a try, and helped your reading grow.":settings.assisted?"Read the word out loud to your grown-up.":"Tap the microphone and read this word out loud."}</DialogDescription>
  <Progress value={index/words.length*100} aria-label="Adventure progress"/>
  {finished?<div className="round-finished"><img src="/images/frog-reader.png" alt="Your frog friend celebrating" width="230" height="230"/><div className="finish-stars"><Star/><Star/><Star/></div><h3>{score} words read. {score} stars earned.</h3><p>{score===0?"It's okay to take your time. Let's give these words another try.":"Every word is a step forward. You should feel proud!"}</p><div className="game-actions"><button className="primary-button" onClick={()=>{setIndex(0);setScore(0);setStatus("idle");setHint(false);setMessage("");}}><RotateCcw size={17}/>Play again</button><button className="secondary-button" onClick={onClose}>Back to my dashboard</button></div></div>:<>
    <div className={`word-stage ${status==="correct"?"celebrating":""}`}><span className="word-counter">WORD {index+1} OF {words.length}</span><span key={index} className="reading-word">{word.text}</span><span className="word-type">{activity==="Sight Word Stars"?"A familiar little word":activity==="Sound Safari"?"Put the sounds together":"You can do this, Lily"}</span>{status==="correct"&&<div className="celebration" aria-hidden="true">{Array.from({length:12},(_,i)=><Star key={i} style={{"--angle":`${i*30}deg`,"--distance":`${90+i%3*35}px`} as React.CSSProperties} size={15+i%3*6} fill="currentColor"/>)}</div>}</div>
    <div className={`game-feedback ${status}`} aria-live="polite" aria-atomic="true">{status==="correct"?<Check size={22}/>:status==="checking"||status==="loading"?<LoaderCircle size={20} className="spin"/>:status==="retry"?<Heart size={20}/>:null}<p>{message||"Take your time. Your frog friend is cheering you on."}</p></div>
    {status==="loading"&&<div className="model-progress"><Progress value={download} aria-label="Listening model file download"/><span>Downloading the listening helper{download>0?` · current file ${download}%`:"..."}</span></div>}
    <div className="game-actions">{settings.assisted?<button disabled={busy||status==="correct"||speaking} className="primary-button mic-button" onClick={()=>celebrate("parent")}><Check size={20}/>My grown-up heard it</button>:<button disabled={(busy&&status!=="recording")||status==="correct"||speaking} className={`primary-button mic-button ${status==="recording"?"recording":""}`} onClick={listen}>{status==="recording"?<Square size={19} fill="currentColor"/>:status==="checking"||status==="loading"?<LoaderCircle size={20} className="spin"/>:<Mic size={22}/>} {status==="recording"?"Done reading":status==="checking"?"Checking your word...":status==="loading"?"Getting ready...":status==="retry"||status==="error"?"Let's try again":"I'm ready to read"}</button>}
    {status==="correct"?<button className="secondary-button" onClick={next}>Next word</button>:<button className="secondary-button" disabled={busy||speaking} onClick={()=>{setHint(!hint);if(!hint)speak(word.cue,.75);}}><Lightbulb size={18}/>Give me a hint</button>}</div>
    {hint&&status!=="correct"&&<div className="hint-panel"><div className="sound-chunks" aria-label="Word parts">{word.chunks.map((chunk,i)=><span key={i}>{chunk}</span>)}</div><p>{word.cue}</p><div><button onClick={()=>speak(word.cue)} disabled={busy||speaking}><Volume2 size={16}/>Explain the sounds</button><button onClick={()=>speak(word.text,.65)} disabled={busy||speaking}><Volume2 size={16}/>Hear the whole word</button></div><p className="example-sentence">{word.sentence}</p></div>}
    {ttsError&&<p className="audio-error" role="status">{ttsError}</p>}
    <div className="game-bottom"><button disabled={busy||speaking||status==="correct"} onClick={()=>speak(word.text,.65)}><Volume2 size={16}/>Hear the word</button><span><Heart size={13}/>Every try counts.</span><button disabled={busy||status==="correct"} onClick={next}>Come back to this<SkipForward size={14}/></button></div>
  </>}
  </DialogContent></Dialog>;
}
function BookIcon({activity}:{activity:string}) {return activity==="Sight Word Stars"?<Star size={15}/>:<Sparkles size={15}/>;}
