"use client";

import { useEffect, useState } from "react";
import { BookOpen, House, ChartNoAxesColumnIncreasing, Trophy, Settings, Leaf, Star, Sparkles, Flame, Clock3, Sprout, AudioLines, Volume2, Heart, Play, ChevronRight, BookMarked } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ReadingGame } from "@/components/reading-game";
import { NavigationButton } from "@/components/navigation-button";
import { ParentCorner } from "@/components/parent-corner";
import { LearningProgress, Rewards } from "@/components/learning-progress";
import { countReadWords, defaultSettings, readSettings, readLibraryPositions, practiceItems, localDay, type ReadingRecord, type Settings as ReadingSettings } from "@/lib/reading";

const activities = [
  { title: "Word Hop", category: "words", tag: "START HERE", description: "Little words. Big adventures.\nRead a word and hop ahead!", icon: BookOpen, color: "mint", skill: "Everyday words", time: "5 min", button: "Let's play", sample: "cat" },
  { title: "Sound Safari", category: "sounds", tag: "SOUND IT OUT", description: "Go exploring with letter sounds.\nBlend them into a whole word.", icon: AudioLines, color: "peach", skill: "Sounds & blending", time: "5 min", button: "Let's explore", sample: "sh" },
  { title: "Sight Word Stars", category: "words", tag: "SHINE BRIGHT", description: "Meet the words you see all the time.\nMake each one a familiar friend.", icon: Star, color: "lavender", skill: "Sight words", time: "5 min", button: "Let's shine", sample: "the" },
  { title: "Sentence Pond", category: "sentences", tag: "READ IT ALL", description: "Little words come together.\nRead a whole sentence and hop ahead!", icon: BookMarked, color: "mint", skill: "Whole sentences", time: "5 min", button: "Let's read sentences", sample: "I can hop." },
  { title: "Sentence Scramble", category: "sentences", tag: "BUILD & READ", description: "Tap the words into place.\nThen read your sentence out loud.", icon: Sparkles, color: "peach", skill: "Word order", time: "5 min", button: "Let's build a sentence", sample: "can · frog · jump" },
  { title: "Story Trail", category: "sentences", tag: "A LITTLE STORY", description: "Meet animal friends on new adventures.\nRead the story one sentence at a time.", icon: BookOpen, color: "lavender", skill: "Reading a story", time: "5 min", button: "Let's read a story", sample: "A little book." },
];

export default function Home() {
  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState<string | null>(null);
  const [records,setRecords]=useState<ReadingRecord[]>([]);
  const [settings,setSettings]=useState<ReadingSettings>(defaultSettings);
  const [positions,setPositions]=useState<Record<string,number>>({});
  const [ready,setReady]=useState(false);
  const [storageError,setStorageError]=useState(false);
  useEffect(()=>{try{
    const saved=JSON.parse(localStorage.getItem("lilypad.v1")??"null");
    if(saved){
      const previous=Array.isArray(saved.records)?saved.records.filter((r:ReadingRecord)=>typeof r?.word==="string"&&typeof r?.activity==="string"&&typeof r?.at==="string"&&Number.isFinite(Date.parse(r.at))&&(r.source==="speech"||r.source==="parent")):[];
      setRecords(previous);setPositions(readLibraryPositions(saved.positions,previous));
      if(saved.settings)setSettings(readSettings(saved.settings));
    }
  }catch{setStorageError(true);}setReady(true);},[]);
  useEffect(()=>{if(ready)try{localStorage.setItem("lilypad.v1",JSON.stringify({records,settings,positions}));}catch{setStorageError(true);}},[records,settings,positions,ready]);
  const today=countReadWords(records.filter(r=>localDay(new Date(r.at))===localDay()));
  const totalWords=countReadWords(records);
  const readingDays=new Set(records.map(r=>localDay(new Date(r.at)))).size;
  const onRead=(record:ReadingRecord)=>{
    setRecords(r=>[...r,record]);
    if(settings.sound)try{const context=new AudioContext();const osc=context.createOscillator();const gain=context.createGain();osc.connect(gain);gain.connect(context.destination);osc.type="sine";osc.frequency.setValueAtTime(660,context.currentTime);osc.frequency.setValueAtTime(880,context.currentTime+.12);gain.gain.setValueAtTime(.07,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.35);osc.start();osc.stop(context.currentTime+.35);osc.onended=()=>{void context.close();};}catch{}
  };
  useEffect(()=>{
    const context=(document as Document & {modelContext?:{registerTool:(tool:object,options:object)=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    try{Promise.resolve(context.registerTool({name:"start_reading_adventure",title:"Start reading adventure",description:"Open a LiliPad reading game. Does not record audio or award stars.",inputSchema:{type:"object",properties:{activity:{type:"string",enum:activities.map(item=>item.title)}},required:["activity"],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input:unknown){const a=(input as {activity?:string})?.activity;if(!activities.some(item=>item.title===a))throw new Error("Choose a supported reading adventure.");setSelected(a!);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return {opened:a};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
    return()=>lifecycle.abort();
  },[]);
  return <SidebarProvider style={{ "--sidebar-width": "248px" } as React.CSSProperties}>
    <Sidebar className="lily-sidebar">
      <SidebarHeader className="brand-area"><a className="brand" href="/" aria-label="LiliPad home"><span className="brand-mark"><Leaf size={26} strokeWidth={2.4}/></span>Lili<span>Pad</span></a><p>A little practice. A lot of possibility.</p></SidebarHeader>
      <SidebarContent><div className="nav-label">LILI'S LITTLE WORLD</div><nav className="side-nav" aria-label="Main navigation">{[{id:"home",label:"My dashboard",icon:House},{id:"games",label:"Reading games",icon:BookOpen},{id:"progress",label:"My progress",icon:ChartNoAxesColumnIncreasing},{id:"rewards",label:"My rewards",icon:Trophy}].map(({id,label,icon:Icon})=><NavigationButton key={id} className={(page===id?"active":"")} onClick={()=>setPage(id)}><Icon size={21}/>{label}{id===page&&<span className="nav-dot"/>}</NavigationButton>)}</nav><div className="side-note"><span className="note-icon"><Sprout size={29}/></span><h3>Growing, one word<br/>at a time.</h3><p>Every little try helps<br/>your reading bloom.</p><span className="note-flower"><Sparkles size={20}/></span></div></SidebarContent>
      <SidebarFooter className="sidebar-bottom"><NavigationButton className="parent-link" onClick={()=>setPage("parents")}><Settings size={19}/>Parent corner</NavigationButton><div className="profile"><span className="avatar">L</span><div><strong>Lili</strong><span>Our little word explorer</span></div><span className="profile-spark"><Sparkles size={18}/></span></div></SidebarFooter>
    </Sidebar>
    <SidebarInset className="workspace"><header className="topbar"><div className="breadcrumb"><SidebarTrigger className="mobile-menu"/><span>My learning space</span><ChevronRight size={14}/><strong>{page==="home"?"Dashboard":page==="parents"?"Parent corner":page==="games"?"Reading games":page==="progress"?"My progress":"My rewards"}</strong></div><div className="header-right"><span className="grade-pill"><Sprout size={15}/>Grade 2</span><span className="mini-avatar">L</span></div></header>
    <main className="main-content"><div className="greeting"><div><div className="eyebrow"><span/> A FRESH DAY TO GROW</div><h1>{page==="home"?<>Hi, Lili! Let's make a little magic.<span className="hello-star"><Sparkles/></span></>:page==="games"?"A little adventure awaits.":page==="progress"?"Look how you're growing!":page==="parents"?"A little help behind the scenes.":"Your very own treasure collection."}</h1><p>One word, one happy hop. Your reading adventure starts here.</p></div></div>
    {page==="home"&&<><section className="welcome-card"><div className="welcome-copy"><span className="small-pill"><Sparkles size={14}/>YOUR NEXT LITTLE ADVENTURE</span><h2>Ready, set,<br/><span>let's read!</span></h2><p>Say it out loud, give it a try, and watch<br className="desktop-break"/> your reading confidence grow.</p><button className="primary-button" onClick={()=>setSelected("Word Hop")}><Play size={16} fill="currentColor"/>Let's play Word Hop</button><span className="welcome-foot"><Heart size={14}/>No rush. No pressure. Just you.</span></div><div className="welcome-art"><span className="art-caption">You've got this, Lili!</span><img src="/images/frog-reader.png" alt="A friendly frog reading a book on a lily pad" width="285" height="285"/><span className="art-star star-one"><Sparkles size={24}/></span><span className="art-star star-two"><Star size={16}/></span></div><div className="hero-bottom-line"/></section>
    <section className="stats-strip" aria-label="Reading progress"><div><span className="stat-icon green"><BookOpen size={22}/></span><div><strong>{totalWords} <small>words</small></strong><span>Read in words and sentences</span></div></div><div><span className="stat-icon gold"><Star size={22}/></span><div><strong>{records.length} <small>stars</small></strong><span>A sparkle for every happy hop</span></div></div><div><span className="stat-icon peach"><Flame size={22}/></span><div><strong>{readingDays?`${readingDays} reading ${readingDays===1?"day":"days"}`:"Let's begin!"}</strong><span>{readingDays?"Growing at your own pace":"Your first day of growing"}</span></div></div></section></>}
    {(page==="home"||page==="games")&&<section className="activities-section"><div className="section-heading"><div><h2>Pick your next adventure</h2><p>A little play goes a long way.</p></div><span className="section-note"><BookMarked size={16}/>Made for your growing reader</span></div><Tabs defaultValue="all"><TabsList className="activity-tabs"><TabsTrigger value="all">All adventures</TabsTrigger><TabsTrigger value="words">Word practice</TabsTrigger><TabsTrigger value="sounds">Letter sounds</TabsTrigger><TabsTrigger value="sentences">Sentences & stories</TabsTrigger></TabsList>{["all","words","sounds","sentences"].map(filter=><TabsContent value={filter} key={filter}><div className="activity-grid">{activities.filter(a=>filter==="all"||a.category===filter).map(({title,tag,description,icon:Icon,color,skill,time,button,sample})=><article className={`activity-card ${color}`} key={title}><div className="activity-art"><span className="activity-tag">{tag}</span><span className="activity-glyph"><Icon size={61} strokeWidth={1.6}/></span><span className={`sample-word ${title.startsWith("Sentence")||title==="Story Trail"?"sentence-sample":""}`}>{sample}</span><span className="activity-spark"><Sparkles size={19}/></span></div><div className="activity-body"><h3>{title}</h3><span className="library-size">{title==="Story Trail"?`${practiceItems(title).length/6} stories · 6 sentences each`:`${practiceItems(title).length} ${title.startsWith("Sentence")?"sentences":"words"} to explore`}</span><p>{description}</p><div className="activity-meta"><span><Sprout size={14}/>{skill}</span><span><Clock3 size={14}/>{time}</span></div><button onClick={()=>setSelected(title)}>{button}<Play size={14} fill="currentColor"/></button></div></article>)}</div></TabsContent>)}</Tabs></section>}
    {page==="home"&&<section className="bottom-grid"><div className="daily-goal"><span className="goal-symbol"><Star size={26}/></span><div><div className="goal-title"><h3>Small steps, happy hops</h3><span>{Math.min(today,10)} / 10 words</span></div><p>{today>=10?"Your daily goal is complete. Look at you grow!":"Read 10 words today. One happy hop at a time!"}</p><Progress value={Math.min(today/10*100,100)} aria-label="Daily word goal"/></div></div><div className="gentle-note"><Heart size={20}/><p>Mistakes are how we learn.<br/><strong>Every try is a little win.</strong></p></div></section>}
    {page==="progress"&&<LearningProgress records={records} onPlay={()=>setSelected("Word Hop")}/>}
    {page==="rewards"&&<Rewards records={records} onPlay={()=>setSelected("Word Hop")}/>}
    {page==="parents"&&<ParentCorner settings={settings} onChange={setSettings} storageError={storageError}/>}
    {storageError&&page!=="parents"&&<p className="storage-note">Progress cannot be saved in this browser. Visit Parent corner for details.</p>}
    <footer className="page-footer"><Leaf size={14}/>Made with love, for Lili.<span>A little brighter with every word.</span></footer>
    </main>
    {selected&&<ReadingGame key={selected} activity={selected} onClose={()=>setSelected(null)} onRead={onRead} settings={settings} position={positions[selected]??0} onAdvance={position=>setPositions(previous=>({...previous,[selected]:position}))}/>}
    </SidebarInset>
  </SidebarProvider>;
}
