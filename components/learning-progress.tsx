"use client";
import { BookOpen, Sprout, Star, Trophy, Heart, Sparkles, Mic, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { countReadWords, localDay, sentenceWords, type ReadingRecord } from "@/lib/reading";
export function LearningProgress({records,onPlay}:{records:ReadingRecord[];onPlay:()=>void}) {
 const unique=[...new Set(records.flatMap(r=>r.kind==="sentence"?sentenceWords(r.word):[r.word]))];
 const sentences=[...new Set(records.filter(r=>r.kind==="sentence").map(r=>r.word))];
 const total=countReadWords(records);
 const today=countReadWords(records.filter(r=>localDay(new Date(r.at))===localDay()));
 return <div className="progress-view">
   <div className="progress-summary"><span className="parent-icon"><Sprout size={32}/></span><h2>Every word helps you bloom.</h2><p>{records.length?`You've read ${total} words across ${new Set(records.map(r=>localDay(new Date(r.at)))).size} reading days. Keep growing at your own pace.`:"Your story is just beginning. Read your first word or sentence and see your progress grow here."}</p><button className="primary-button" onClick={onPlay}><BookOpen size={18}/>Let's read a little</button></div>
   <div className="progress-details"><section><h3>Today's little goal</h3><strong>{Math.min(today,10)} <small>of 10 words</small></strong><Progress value={Math.min(today/10*100,100)} aria-label="Today's reading goal"/><p>{today>=10?"You reached your goal! What a lovely day of reading.":"One word at a time. There is no hurry."}</p></section><section><h3>Words you've practiced</h3>{unique.length?<div className="word-collection">{unique.map(w=><span key={w}>{w}</span>)}</div>:<p>Your words will collect here after you read them.</p>}</section></div>
   {sentences.length>0&&<section className="history-card sentence-collection"><h3>Sentences you've read</h3><ul>{sentences.map(text=><li key={text}>{text}</li>)}</ul></section>}
   {records.length>0&&<section className="history-card"><h3>Your latest happy hops</h3>{records.slice(-10).reverse().map((r,i)=><div key={r.at+i}><span className={`history-word ${r.kind==="sentence"?"history-sentence":""}`}>{r.word}</span><span>{r.activity}</span><span className="history-source">{r.source==="parent"?<Users size={14}/>:<Mic size={14}/>} {r.source==="parent"?"Read together":"Read aloud"}</span><time dateTime={r.at}>{new Date(r.at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</time></div>)}</section>}
 </div>;
}
export function Rewards({records,onPlay}:{records:ReadingRecord[];onPlay:()=>void}) {
 const days=new Set(records.map(r=>localDay(new Date(r.at)))).size;
 const words=countReadWords(records);
 const badges=[{title:"First happy hop",description:"Read your first word or sentence",icon:Sprout,target:1,current:records.length},{title:"Little word explorer",description:"Read 10 words",icon:BookOpen,target:10,current:words},{title:"Growing reader",description:"Practice on 3 different days",icon:Heart,target:3,current:days},{title:"Pond superstar",description:"Read 30 words",icon:Trophy,target:30,current:words}];
 return <div className="rewards-view"><section className="rewards-intro"><Sparkles size={29}/><h2>A little sparkle for your hard work.</h2><p>Every word or whole sentence you read earns a star. Your treasures grow with you!</p><span className="star-count"><Star size={35} fill="currentColor"/>{records.length}<small>stars collected</small></span></section><div className="badge-grid">{badges.map(({title,description,icon:Icon,target,current})=><article className={current>=target?"badge-card earned":"badge-card"} key={title}><span className="badge-icon"><Icon size={42}/></span><span className="badge-status">{current>=target?"YOU EARNED IT!":"A LITTLE GOAL"}</span><h3>{title}</h3><p>{description}</p><Progress value={Math.min(current/target*100,100)} aria-label={`${title} progress`}/><span className="badge-progress">{Math.min(current,target)} / {target}</span></article>)}</div><button className="primary-button" onClick={onPlay}><BookOpen size={18}/>Read and collect a star</button></div>;
}
