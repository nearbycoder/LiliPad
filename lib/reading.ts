export type Word = { text: string; chunks: string[]; cue: string; sentence: string; aliases?: string[] };
export const wordSets: Record<string, Word[]> = {
  "Word Hop": [
    {text:"cat",chunks:["c","a","t"],cue:"The first sound is kuh, like the start of cup. The middle sound is a, like apple. The last sound is tuh, like the start of top.",sentence:"The cat takes a nap."},
    {text:"sun",chunks:["s","u","n"],cue:"Start with sss. The middle sound is uh. End with nnn. Blend the sounds together.",sentence:"The sun is warm.",aliases:["son"]},
    {text:"hop",chunks:["h","o","p"],cue:"Start with huh. The middle sound is the o in hot. End with puh. Now blend them together.",sentence:"A frog can hop."},
    {text:"red",chunks:["r","e","d"],cue:"Start with rrr. The middle sound is eh. End with duh. Blend the sounds together.",sentence:"I have a red hat."},
    {text:"fish",chunks:["f","i","sh"],cue:"Start with fff. The middle sound is the i in insect. S and H together make shhh.",sentence:"The fish swims in the pond."},
    {text:"nest",chunks:["n","e","s","t"],cue:"Start with nnn. Then eh. Then sss. End with tuh. Blend the sounds together.",sentence:"The bird has a nest."},
    {text:"frog",chunks:["f","r","o","g"],cue:"Start with fff, then rrr. The middle vowel is the o in hot. End with guh.",sentence:"The frog sits on a lily pad."},
    {text:"jump",chunks:["j","u","m","p"],cue:"Start with the j sound in jam. Then uh, mmm, and puh. Blend them together.",sentence:"I can jump over the puddle."},
    {text:"green",chunks:["g","r","ee","n"],cue:"Start with guh, then rrr. Two E letters say the long e sound. End with nnn.",sentence:"The leaf is green."},
    {text:"happy",chunks:["hap","py"],cue:"This word has two parts. The first part sounds like hap. The last part sounds like pea. Put them together.",sentence:"Reading makes me happy."},
  ],
  "Sound Safari": [
    {text:"ship",chunks:["sh","i","p"],cue:"S and H together make shhh. Then the i in insect. End with puh.",sentence:"The ship sails on the sea."},
    {text:"shop",chunks:["sh","o","p"],cue:"S and H say shhh. Then the o in hot. End with puh.",sentence:"We visit the little shop."},
    {text:"chat",chunks:["ch","a","t"],cue:"C and H together make the ch sound in cheese. Then the a in apple. End with tuh.",sentence:"I like to chat with my friend."},
    {text:"thin",chunks:["th","i","n"],cue:"T and H together make the th sound in think. Then the i in insect. End with nnn.",sentence:"This stick is thin."},
    {text:"duck",chunks:["d","u","ck"],cue:"Start with duh. Then uh. C and K together make one kuh sound.",sentence:"The duck swims in the pond."},
    {text:"rain",chunks:["r","ai","n"],cue:"Start with rrr. A and I together say the long a sound. End with nnn.",sentence:"The rain helps flowers grow."},
    {text:"seed",chunks:["s","ee","d"],cue:"Start with sss. Two E letters say the long e sound. End with duh.",sentence:"We plant a little seed."},
    {text:"boat",chunks:["b","oa","t"],cue:"Start with buh. O and A together say the long o sound. End with tuh.",sentence:"The boat floats on the water."},
    {text:"moon",chunks:["m","oo","n"],cue:"Start with mmm. Two O letters make the oo sound in food. End with nnn.",sentence:"The moon shines at night."},
    {text:"light",chunks:["l","igh","t"],cue:"Start with lll. I, G, and H together say the long i sound. End with tuh.",sentence:"Turn on the light."},
  ],
  "Sight Word Stars": [
    {text:"the",chunks:["th","e"],cue:"This is a heart word. The T and H work together. Listen to the whole word and try it again.",sentence:"The frog is green."},
    {text:"said",chunks:["s","ai","d"],cue:"This is a heart word. In this word, A and I sound like the e in egg.",sentence:"Lili said hello."},
    {text:"you",chunks:["y","ou"],cue:"This is a heart word. Y starts the word. O and U sound like oo in moon.",sentence:"You are a kind friend."},
    {text:"was",chunks:["w","a","s"],cue:"This is a heart word. The A and S are the tricky parts. Listen to the whole word.",sentence:"It was a sunny day."},
    {text:"they",chunks:["th","ey"],cue:"The T and H work together. E and Y say the long a sound.",sentence:"They play in the park."},
    {text:"have",chunks:["h","a","ve"],cue:"Start with huh, then the a in apple. The E is silent. End with the v sound.",sentence:"I have a new book."},
    {text:"come",chunks:["c","o","me"],cue:"This is a heart word. Here the O sounds like uh. The E is silent.",sentence:"Come and read with me."},
    {text:"some",chunks:["s","o","me"],cue:"This is a heart word. Here the O sounds like uh. The E is silent.",sentence:"We read some words."},
    {text:"where",chunks:["wh","ere"],cue:"This is a question word. Listen to the whole word. It rhymes with bear.",sentence:"Where is my book?",aliases:["wear","ware"]},
    {text:"there",chunks:["th","ere"],cue:"The T and H work together. The rest of the word rhymes with air.",sentence:"The book is over there.",aliases:["their","they're"]},
  ],
};
export function isWordMatch(transcript: string, word: Word): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/[.!?,;:]/g, "").replace(/\s+/g," ").trim();
  const text=clean(transcript);
  // Compare the whole utterance, never a substring or a fuzzy edit-distance match.
  return [word.text,...(word.aliases??[])].some(w=>clean(w)===text);
}
export type ReadingRecord = {word: string; activity: string; at: string; source: "speech" | "parent"};
export type Settings = {sound: boolean; assisted: boolean};
export function localDay(date = new Date()) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
