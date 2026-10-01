import { vocabulary } from './reading-vocabulary.ts';
import { pronunciations } from './reading-pronunciations.ts';
import type { Word, Sentence } from './reading.ts';

const consonants: Record<string, string> = { B:'ball', D:'dog', F:'fan', G:'go', K:'cup', L:'leaf', M:'mouse', N:'nose', P:'pen', R:'rain', S:'soap', T:'top', V:'van', W:'water', Y:'yes', Z:'zoo', HH:'hat', SH:'shoe', CH:'cheese', JH:'jam' };
const vowels: Record<string, string> = { AE:'apple', EH:'egg', IH:'sit', IY:'see', AA:'hot', AO:'fall', UH:'book', UW:'food', AH:'up', AY:'ice', EY:'day', OW:'go', AW:'cow', OY:'boy', ER:'bird' };
const ambiguous = new Set('read lead wind tear bow live close use bass minute record present object content produce project desert'.split(' '));
const homophones: Record<string,string[]> = { one:['won'], two:['too','to'], four:['for'], eight:['ate'], blue:['blew'], night:['knight'], sea:['see'], see:['sea'], hear:['here'], here:['hear'], right:['write'], write:['right'], week:['weak'], weak:['week'], pair:['pear'], pear:['pair'], meat:['meet'], meet:['meat'], flower:['flour'], flour:['flower'], their:['there',"they're"], wood:['would'], would:['wood'], knew:['new'], new:['knew'], eye:['I'], buy:['by','bye'], by:['buy','bye'] };
function makeWord(text: string): Word {
  const phones = pronunciations[text].map(phone => phone.replace(/[012]/g,''));
  const first = phones[0];
  let cue = '';
  if (!ambiguous.has(text)) {
    if (consonants[first]) cue = `Start with the first sound in ${consonants[first]}. `;
    else if (first === 'TH') cue = 'Rest the tip of your tongue lightly between your teeth. Gently blow air without buzzing your throat. ';
    else if (first === 'DH') cue = 'Rest your tongue lightly between your teeth and gently buzz your throat, like the start of this. ';
    const vowelSounds = phones.filter(phone => vowels[phone]);
    if (vowelSounds.length === 1) cue += `The vowel sounds like the vowel in ${vowels[vowelSounds[0]]}. `;
  }
  const display = text === 'i' ? 'I' : text;
  return { text:display, chunks:[display], cue:`${cue}Listen to the whole word, then try it: ${display}.`, sentence:`Look for “${display}” in your next book.`, ...(homophones[text] ? {aliases:homophones[text]} : {}) };
}
function pool(...groups: string[]): string[] {
  return [...new Set(groups.flatMap(group => vocabulary[group]))].filter(word => pronunciations[word]);
}
export function expandWordLibraries(starters: Record<string,Word[]>): Record<string,Word[]> {
  const everyday = pool('short','animals','home','school','nature','food','actions','describing','people','body','time','places');
  const banks: Record<string,string[]> = {
    'Word Hop': everyday.toSorted((a,b) => a.length-b.length),
    'Sound Safari': pool('phonics','short','nature','actions'),
    'Sight Word Stars': pool('common','short','school','actions','describing','home','people'),
  };
  return Object.fromEntries(Object.entries(starters).map(([activity,initial]) => {
    const seen = new Set(initial.map(word => word.text.toLowerCase()));
    const additions = banks[activity].filter(word => !seen.has(word)).map(makeWord);
    const items = [...initial,...additions].slice(0,600);
    if (items.length !== 600) throw new Error(`Incomplete word library: ${activity}`);
    return [activity,items];
  }));
}

const animals = ['frog','duck','rabbit','mouse','cat','dog','fox','bear','otter','owl','robin','squirrel','turtle','hedgehog','beaver','deer','panda','koala','goat','pony'];
const pondActions = ['sits beside a little pond','looks up at the blue sky','rests under a tall tree','finds a leaf on the path','walks along a quiet trail','watches a bird in the tree','sees a boat on the water','takes a nap in the shade','looks for a cozy place','hears the rain on the roof','plays a game with a friend','finds a smooth little stone','watches the clouds drift by','waits for the sun to rise','sees a rainbow in the sky','looks at the bright moon','walks past a field of flowers','listens to a song in the woods','rests beside a garden gate','finds a red hat on a log','looks for a book to read','shares a snack with a friend','watches a leaf float away','finds a shell beside the water','takes a walk in the sunshine','sees a butterfly near a flower','stops to look at a tiny seed','hides behind a leafy bush','looks at a star in the sky','smiles at a new friend'];
const buildActions = ['can hop on a log','sees a little bird','has a red hat','likes the warm sun','rests by the pond','can find a leaf','looks at the moon','sees a blue boat','has a little book','can walk with a friend','sits under a tree','likes a quiet nap','sees a bright star','can play a game','has a green bag','finds a small stone','looks for a friend','sees a tall tree','has a yellow cup','can hear the rain','likes the cool shade','sees a pink flower','can look at the sky','has a soft quilt','finds a tiny seed','likes a short story','can sit on a mat','sees a white cloud','looks at a red kite','can share a snack'];
type SentenceFactory = (text:string,phrases:string[]) => Sentence;
function expandSentences(initial:Sentence[],actions:string[],make:SentenceFactory):Sentence[] {
  const items = [...initial]; const seen = new Set(items.map(item => item.text));
  // Interleave characters so consecutive pages vary, rather than repeating one subject.
  for (const action of actions) for (const animal of animals) {
    const subject = `The ${animal}`; const text = `${subject} ${action}.`;
    if (!seen.has(text)) { seen.add(text); items.push(make(text,[subject,action])); }
  }
  return items.slice(0,600);
}
function story(animal:string,theme:number,make:SentenceFactory):Sentence[] {
  const who = `The ${animal}`;
  const plots = [
    {title:`The ${animal}'s new book`,lines:[['finds a new book','beside the pond'],['opens the book','under a tree'],['reads a story','about a little boat'],['draws a boat','on a piece of paper'],['shows the picture','to a friend'],['shares the new book','with the friend']]},
    {title:`The ${animal}'s picnic`,lines:[['packs a picnic','in a little basket'],['takes the basket','to a shady tree'],['spreads a picnic quilt','on the grass'],['puts an apple','on the quilt'],['shares the picnic','with a friend'],['takes the empty basket','back home']]},
    {title:`The ${animal}'s leaf boat`,lines:[['finds a wide leaf','beside a stream'],['folds the leaf','into a little boat'],['sets the leaf boat','on the water'],['watches the little boat','float past a rock'],['catches the leaf boat','with a stick'],['takes the little boat','home to a friend']]},
    {title:`The ${animal}'s garden`,lines:[['finds a little seed','in the garden'],['plants the seed','in soft soil'],['waters the new seed','with a small cup'],['sees a green sprout','a few days later'],['watches the sprout grow','into a tall plant'],['shows the garden plant','to a friend']]},
    {title:`The ${animal}'s lost hat`,lines:[['looks for a blue hat','by the front door'],['looks for the hat','under the bed'],['asks a friend','to help find the hat'],['spots the blue hat','behind a chair'],['puts the hat','on a little hook'],['thanks the friend','for helping with the hat']]},
  ];
  const plot = plots[theme];
  return plot.lines.map(([action,ending]) => ({...make(`${who} ${action} ${ending}.`,[`${who} ${action}`,ending]),storyTitle:plot.title}));
}
export function expandSentenceLibraries(starters:Record<string,Sentence[]>,make:SentenceFactory):Record<string,Sentence[]> {
  return {
    'Sentence Pond':expandSentences(starters['Sentence Pond'],pondActions,make),
    'Sentence Scramble':expandSentences(starters['Sentence Scramble'],buildActions,make),
    'Story Trail':[
      ...starters['Story Trail'].map(item => ({...item,storyTitle:"The frog's little book"})),
      ...animals.flatMap(animal => Array.from({length:5},(_,theme) => story(animal,theme,make)).flat()),
    ],
  };
}
