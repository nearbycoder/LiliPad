"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2, Lightbulb, Star, Sparkles, Check, RotateCcw, Heart, LoaderCircle, SkipForward } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { MicrophoneCapture } from "@/lib/microphone-capture";
import { isWordMatch, wordSets, type ReadingRecord, type Settings } from "@/lib/reading";

type Status="idle"|"loading"|"recording"|"checking"|"correct"|"retry"|"paused"|"error";
export function ReadingGame({activity,onClose,onRead,settings}:{activity:string;onClose:()=>void;onRead:(record:ReadingRecord)=>void;settings:Settings}) {
  const words=wordSets[activity];
  const [index,setIndex]=useState(0);
  const [status,setStatus]=useState<Status>("idle");
  const [message,setMessage]=useState("");
  const [hint,setHint]=useState(false);
  const [download,setDownload]=useState(0);
  const [loading,setLoading]=useState(!settings.assisted);
  const [listening,setListening]=useState(false);
  const [score,setScore]=useState(0);
  const [ttsError,setTtsError]=useState("");
  const [speaking,setSpeaking]=useState(false);
  const session=useRef({mounted:true,running:false,modelReady:false,workerBusy:false,epoch:0,micEpoch:0,request:0,pending:null as null|{id:number;epoch:number;index:number},index:0,status:"idle" as Status,speaking:false});
  const worker=useRef<Worker|null>(null);
  const capture=useRef<MicrophoneCapture|null>(null);
  const advanceTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const resumeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const modelTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const speechTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const onReadRef=useRef(onRead);onReadRef.current=onRead;
  const settingsRef=useRef(settings);settingsRef.current=settings;
  const word=words[Math.min(index,words.length-1)];
  const finished=index>=words.length;

  function transition(nextStatus:Status,text:string){session.current.status=nextStatus;setStatus(nextStatus);setMessage(text);}
  function invalidate(){session.current.epoch++;capture.current?.hold();if(resumeTimer.current)clearTimeout(resumeTimer.current);}
  function pause(text="Take a little break. Tap resume when you're ready."){
    const wasCorrect=session.current.status==="correct";
    invalidate();session.current.micEpoch++;session.current.running=false;setListening(false);
    if(speechTimer.current)clearTimeout(speechTimer.current);window.speechSynthesis?.cancel();session.current.speaking=false;setSpeaking(false);
    capture.current?.close();capture.current=null;
    if(!wasCorrect){if(advanceTimer.current)clearTimeout(advanceTimer.current);transition("paused",text);}
  }
  function fail(text:string){pause(text);transition("error",text);}
  function resumeFeedback(text="I'm listening. Say the word when you're ready.") {
    const state=session.current;
    if(!state.mounted||!state.running||state.speaking||state.index>=words.length)return;
    if(!state.modelReady){transition("loading","Getting your listening helper ready...");return;}
    if(state.workerBusy||!capture.current)return;
    if(capture.current.listen())transition("recording",text);
  }
  function next(){
    if(advanceTimer.current)clearTimeout(advanceTimer.current);
    invalidate();window.speechSynthesis?.cancel();session.current.speaking=false;setSpeaking(false);
    const nextIndex=session.current.index+1;session.current.index=nextIndex;
    setIndex(nextIndex);setHint(false);setTtsError("");
    if(nextIndex>=words.length){pause();transition("idle","");}
    else if(session.current.running)resumeFeedback();
    else transition("idle","");
  }
  function celebrate(source:ReadingRecord["source"]){
    const state=session.current;
    if(state.status==="correct"||state.index>=words.length)return;
    invalidate();transition("correct","You got it!");setScore(n=>n+1);
    onReadRef.current({word:words[state.index].text,activity,at:new Date().toISOString(),source});
    // Allow the chime to finish before listening again; no button or long intermission.
    advanceTimer.current=setTimeout(()=>actions.current.next(),450);
  }
  function submitAudio(audio:Float32Array){
    const state=session.current;
    if(!state.running||state.workerBusy||state.speaking||state.status==="correct"||state.index>=words.length)return;
    const id=++state.request;
    state.pending={id,epoch:state.epoch,index:state.index};state.workerBusy=true;
    transition("checking","Checking your word...");
    worker.current?.postMessage({type:"transcribe",audio,id},[audio.buffer]);
    if(modelTimer.current)clearTimeout(modelTimer.current);
    modelTimer.current=setTimeout(()=>{
      worker.current?.terminate();worker.current=null;state.modelReady=false;state.workerBusy=false;state.pending=null;
      if(state.mounted)fail("Listening is taking too long. Tap resume to try again, or read together with a grown-up.");
    },30000);
  }
  function prepareWorker(){
    if(worker.current)return;
    setLoading(true);setDownload(0);
    try {
      const w=new Worker("/speech/worker.js",{type:"module"});worker.current=w;
      const broken=()=>{
        if(modelTimer.current)clearTimeout(modelTimer.current);
        w.terminate();worker.current=null;const state=session.current;
        state.modelReady=false;state.workerBusy=false;state.pending=null;
        if(state.mounted){setLoading(false);fail("Your listening helper couldn't load. Check your connection and tap resume, or use read-together mode.");}
      };
      w.onerror=broken;
      w.onmessage=event=>{
        const state=session.current;if(!state.mounted)return;
        const data=event.data;
        if(data.type==="progress")setDownload(Math.round(data.progress));
        if(data.type==="ready"){
          if(modelTimer.current)clearTimeout(modelTimer.current);
          state.modelReady=true;setLoading(false);
          if(state.running)actions.current.resumeFeedback();
        }
        if(data.type==="result"){
          if(modelTimer.current)clearTimeout(modelTimer.current);
          const pending=state.pending;state.pending=null;state.workerBusy=false;
          if(!pending||data.id!==pending.id||pending.epoch!==state.epoch||pending.index!==state.index||!state.running||state.speaking){
            if(state.status!=="correct")actions.current.resumeFeedback();return;
          }
          if(isWordMatch(data.text,words[state.index]))actions.current.celebrate("speech");
          else {
            setHint(true);
            transition("retry",data.text.trim()?`I heard “${data.text.trim()}”. Try this word again.`:"Let's give this word another try.");
            // Keep the microphone open and automatically accept another attempt.
            capture.current?.listen();
          }
        }
        if(data.type==="error")broken();
      };
      w.postMessage({type:"load"});
      modelTimer.current=setTimeout(broken,180000);
    }catch{setLoading(false);fail("This browser couldn't start the listening helper. Try Chrome or Edge, or use read-together mode.");}
  }
  async function listen(){
    const state=session.current;
    if(state.running){pause();return;}
    if(state.index>=words.length||state.status==="correct"||state.speaking)return;
    state.running=true;setListening(true);const micEpoch=++state.micEpoch;state.epoch++;
    setHint(false);setTtsError("");transition("loading","Opening your microphone...");
    prepareWorker();
    try {
      const microphone=await MicrophoneCapture.open(
        audio=>actions.current.submitAudio(audio),
        ()=>{if(state.running&&!state.speaking)transition("recording","I hear you...");},
        ()=>actions.current.fail("The microphone stopped. Tap resume when you're ready to read again."),
      );
      if(!state.mounted||!state.running||micEpoch!==state.micEpoch){microphone.close();return;}
      capture.current=microphone;resumeFeedback();
    }catch(error){
      if(!state.mounted||!state.running||micEpoch!==state.micEpoch)return;
      fail(error instanceof DOMException&&error.name==="NotAllowedError"?"Allow microphone access in your browser, then tap resume. A grown-up can help.":error instanceof DOMException&&error.name==="NotFoundError"?"No microphone was found. Connect one, or try read-together mode.":error instanceof Error?error.message:"Your microphone couldn't start. Tap resume to try again.");
    }
  }
  function speak(text:string,rate=.75){
    if(session.current.status==="correct")return;
    invalidate();
    if(speechTimer.current)clearTimeout(speechTimer.current);
    if(!("speechSynthesis" in window)){setTtsError("Your browser cannot play spoken hints. Read the hint together.");resumeFeedback();return;}
    // Never transcribe the app's own spoken hints. Resume after playback has ended.
    window.speechSynthesis.cancel();session.current.speaking=true;setSpeaking(true);setTtsError("");
    const epoch=session.current.epoch;
    transition("idle","Listen to the hint, then try the word.");
    const finish=(error=false)=>{
      if(!session.current.mounted||epoch!==session.current.epoch)return;
      if(speechTimer.current)clearTimeout(speechTimer.current);
      session.current.speaking=false;setSpeaking(false);
      if(error)setTtsError("The spoken hint couldn't play. You can read the hint together.");
      resumeTimer.current=setTimeout(()=>actions.current.resumeFeedback(),250);
    };
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang="en-US";utterance.rate=rate;
    const voice=window.speechSynthesis.getVoices().find(v=>v.lang==="en-US"&&v.localService)??window.speechSynthesis.getVoices().find(v=>v.lang.startsWith("en"));if(voice)utterance.voice=voice;
    utterance.onend=()=>finish();utterance.onerror=()=>finish(true);
    speechTimer.current=setTimeout(()=>{window.speechSynthesis.cancel();finish(true);},45000);
    window.speechSynthesis.speak(utterance);
  }
  function playAgain(){
    session.current.index=0;setIndex(0);setScore(0);setHint(false);setTtsError("");transition("idle","");
    if(!settingsRef.current.assisted)void actions.current.listen();
  }
  const actions=useRef({next,celebrate,resumeFeedback,submitAudio,fail,listen});
  actions.current={next,celebrate,resumeFeedback,submitAudio,fail,listen};
  useEffect(()=>{
    session.current.mounted=true;
    if(!settingsRef.current.assisted)prepareWorker();
    const hidden=()=>{if(document.hidden&&session.current.running)pause("Reading is paused. Tap resume when you come back.");};
    document.addEventListener("visibilitychange",hidden);
    return()=>{
      session.current.mounted=false;session.current.running=false;session.current.epoch++;session.current.micEpoch++;
      capture.current?.close();capture.current=null;worker.current?.terminate();worker.current=null;
      for(const timer of [advanceTimer,modelTimer,resumeTimer,speechTimer])if(timer.current)clearTimeout(timer.current);
      window.speechSynthesis?.cancel();document.removeEventListener("visibilitychange",hidden);
    };
    // One model and one microphone session per adventure, not per word.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="reading-dialog" showCloseButton><div className="game-top"><span className="small-pill"><BookIcon activity={activity}/>{activity.toUpperCase()}</span><span><Star size={16} fill="currentColor"/>{score} stars</span></div><DialogTitle className="game-heading">{finished?"Look at you, little reader!":"One word. One happy hop."}</DialogTitle><DialogDescription className="game-description">{finished?"You showed up, gave it a try, and helped your reading grow.":settings.assisted?"Read the word out loud to your grown-up.":"Start once, then read each word out loud. I'll keep listening."}</DialogDescription>
  <Progress value={index/words.length*100} aria-label="Adventure progress"/>
  {finished?<div className="round-finished"><img src="/images/frog-reader.png" alt="Your frog friend celebrating" width="230" height="230"/><div className="finish-stars"><Star/><Star/><Star/></div><h3>{score} words read. {score} stars earned.</h3><p>{score===0?"It's okay to take your time. Let's give these words another try.":"Every word is a step forward. You should feel proud!"}</p><div className="game-actions"><button className="primary-button" onClick={playAgain}><RotateCcw size={17}/>Play again</button><button className="secondary-button" onClick={onClose}>Back to my dashboard</button></div></div>:<>
    <div className={`word-stage ${status==="correct"?"celebrating":""}`}><span className="word-counter">WORD {index+1} OF {words.length}</span><span key={index} className="reading-word">{word.text}</span><span className="word-type">{activity==="Sight Word Stars"?"A familiar little word":activity==="Sound Safari"?"Put the sounds together":"You can do this, Lily"}</span>{status==="correct"&&<div className="celebration" aria-hidden="true">{Array.from({length:12},(_,i)=><Star key={i} style={{"--angle":`${i*30}deg`,"--distance":`${90+i%3*35}px`} as React.CSSProperties} size={15+i%3*6} fill="currentColor"/>)}</div>}</div>
    <div className={`game-feedback ${status}`} aria-live="polite" aria-atomic="true">{status==="correct"?<Check size={22}/>:status==="checking"||status==="loading"?<LoaderCircle size={20} className="spin"/>:status==="retry"?<Heart size={20}/>:null}<p>{message||"Take your time. Your frog friend is cheering you on."}</p></div>
    {loading&&<div className="model-progress"><Progress value={download} aria-label="Listening model file download"/><span>Downloading the listening helper{download>0?` · current file ${download}%`:"..."}</span></div>}
    <div className="game-actions">{settings.assisted?<button disabled={status==="correct"||speaking} className="primary-button mic-button" onClick={()=>celebrate("parent")}><Check size={20}/>My grown-up heard it</button>:<button disabled={status==="correct"||(speaking&&!listening)} className={`primary-button mic-button ${listening?"listening":""}`} onClick={()=>void listen()}>{listening?<Square size={17} fill="currentColor"/>:<Mic size={22}/>} {listening?"Pause listening":status==="paused"||status==="error"?"Resume listening":"Start reading"}</button>}
    <button className="secondary-button" disabled={speaking||status==="correct"} onClick={()=>{setHint(!hint);if(!hint)speak(word.cue,.75);}}><Lightbulb size={18}/>Give me a hint</button></div>
    {hint&&status!=="correct"&&<div className="hint-panel"><div className="sound-chunks" aria-label="Word parts">{word.chunks.map((chunk,i)=><span key={i}>{chunk}</span>)}</div><p>{word.cue}</p><div><button onClick={()=>speak(word.cue)} disabled={speaking}><Volume2 size={16}/>Explain the sounds</button><button onClick={()=>speak(word.text,.65)} disabled={speaking}><Volume2 size={16}/>Hear the whole word</button></div><p className="example-sentence">{word.sentence}</p></div>}
    {ttsError&&<p className="audio-error" role="status">{ttsError}</p>}
    <div className="game-bottom"><button disabled={speaking||status==="correct"} onClick={()=>speak(word.text,.65)}><Volume2 size={16}/>Hear the word</button><span><Heart size={13}/>Every try counts.</span><button disabled={speaking||status==="correct"} onClick={next}>Come back to this<SkipForward size={14}/></button></div>
  </>}
  </DialogContent></Dialog>;
}
function BookIcon({activity}:{activity:string}) {return activity==="Sight Word Stars"?<Star size={15}/>:<Sparkles size={15}/>;}
