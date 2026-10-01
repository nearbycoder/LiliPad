export type Word = { kind?: "word"; text: string; chunks: string[]; cue: string; sentence: string; aliases?: string[] };
export type Sentence = { kind: "sentence"; text: string; phrases: string[]; cue: string };
export type ReadingItem = Word | Sentence;
export const wordSets: Record<string, Word[]> = {
  "Word Hop": [
    {text:"cat",chunks:["c","a","t"],cue:"Start with the first sound in cup. Add the vowel sound in apple. End with the last sound in hat. Blend them: cat.",sentence:"The cat takes a nap."},
    {text:"sun",chunks:["s","u","n"],cue:"Start with the first sound in soap. Add the vowel sound in up. End with the last sound in pen. Blend them: sun.",sentence:"The sun is warm.",aliases:["son"]},
    {text:"hop",chunks:["h","o","p"],cue:"Start with the first sound in hat. Add the vowel sound in hot. End with the last sound in cup. Blend them: hop.",sentence:"A frog can hop."},
    {text:"red",chunks:["r","e","d"],cue:"Start with the first sound in rain. Add the vowel sound in egg. End with the last sound in bed. Blend them: red.",sentence:"I have a red hat."},
    {text:"fish",chunks:["f","i","sh"],cue:"Start with the first sound in fan. Add the vowel sound in sit. The last two letters make one sound, like the start of shoe. Blend them: fish.",sentence:"The fish swims in the pond."},
    {text:"nest",chunks:["n","e","s","t"],cue:"Start with the first sound in nose. Add the vowel sound in egg, the first sound in soap, and the last sound in hat. Blend them: nest.",sentence:"The bird has a nest."},
    {text:"frog",chunks:["f","r","o","g"],cue:"Start with the first sound in fan, then the first sound in rain. Add the vowel sound in hot. End with the last sound in bag. Blend them: frog.",sentence:"The frog sits on a lily pad."},
    {text:"jump",chunks:["j","u","m","p"],cue:"Start with the first sound in jam. Add the vowel sound in up, the first sound in mouse, and the last sound in cup. Blend them: jump.",sentence:"I can jump over the puddle."},
    {text:"green",chunks:["g","r","ee","n"],cue:"Start with the first sounds in go and rain. The two middle letters say the vowel sound in see. End with the last sound in pen. Blend them: green.",sentence:"The leaf is green."},
    {text:"happy",chunks:["hap","py"],cue:"Clap the two parts as you say happy. Start with the first sound in hat. The first vowel sounds like the vowel in apple. The last part rhymes with see.",sentence:"Reading makes me happy."},
  ],
  "Sound Safari": [
    {text:"ship",chunks:["sh","i","p"],cue:"The first two letters make one sound, like the start of shoe. Add the vowel sound in sit. End with the last sound in cup. Blend them: ship.",sentence:"The ship sails on the sea."},
    {text:"shop",chunks:["sh","o","p"],cue:"The first two letters make one sound, like the start of shoe. Add the vowel sound in hot. End with the last sound in cup. Blend them: shop.",sentence:"We visit the little shop."},
    {text:"chat",chunks:["ch","a","t"],cue:"The first two letters make one sound, like the start of cheese. Add the vowel sound in apple. End with the last sound in hat. Blend them: chat.",sentence:"I like to chat with my friend."},
    {text:"thin",chunks:["th","i","n"],cue:"Rest the tip of your tongue lightly between your teeth. Gently blow air, without buzzing your throat, like the first sound in think. Add the vowel sound in sit and the last sound in pen. Blend them: thin.",sentence:"This stick is thin."},
    {text:"duck",chunks:["d","u","ck"],cue:"Start with the first sound in dog. Add the vowel sound in up. The last two letters make one sound, like the last sound in back. Blend them: duck.",sentence:"The duck swims in the pond."},
    {text:"rain",chunks:["r","ai","n"],cue:"Start with the first sound in red. The two middle letters say the vowel sound in day. End with the last sound in pen. Blend them: rain.",sentence:"The rain helps flowers grow."},
    {text:"seed",chunks:["s","ee","d"],cue:"Start with the first sound in soap. The two middle letters say the vowel sound in see. End with the last sound in bed. Blend them: seed.",sentence:"We plant a little seed."},
    {text:"boat",chunks:["b","oa","t"],cue:"Start with the first sound in ball. The two middle letters say the vowel sound in go. End with the last sound in hat. Blend them: boat.",sentence:"The boat floats on the water."},
    {text:"moon",chunks:["m","oo","n"],cue:"Start with the first sound in mouse. The two middle letters say the vowel sound in food. End with the last sound in pen. Blend them: moon.",sentence:"The moon shines at night."},
    {text:"light",chunks:["l","igh","t"],cue:"Start with the first sound in leaf. The three middle letters say the vowel sound in ice. End with the last sound in hat. Blend them: light.",sentence:"Turn on the light."},
  ],
  "Sight Word Stars": [
    {text:"the",chunks:["th","e"],cue:"The first two letters make one sound. Rest your tongue lightly between your teeth and gently buzz your throat, like the start of this. Listen to the whole word: the.",sentence:"The frog is green."},
    {text:"said",chunks:["s","ai","d"],cue:"This is a heart word. In this word, A and I sound like the e in egg.",sentence:"Lili said hello."},
    {text:"you",chunks:["y","ou"],cue:"This is a heart word. Y starts the word. O and U sound like oo in moon.",sentence:"You are a kind friend."},
    {text:"was",chunks:["w","a","s"],cue:"This is a heart word. The A and S are the tricky parts. Listen to the whole word.",sentence:"It was a sunny day."},
    {text:"they",chunks:["th","ey"],cue:"Rest your tongue lightly between your teeth and gently buzz your throat, like the start of this. The last two letters say the vowel sound in day. Blend them: they.",sentence:"They play in the park."},
    {text:"have",chunks:["h","a","ve"],cue:"Start with the first sound in hat. Add the vowel sound in apple. End with the last sound in give. The final letter is silent. Blend them: have.",sentence:"I have a new book."},
    {text:"come",chunks:["c","o","me"],cue:"This is a heart word. The middle vowel sounds like the vowel in up. The final letter is silent. Listen to the whole word and try it.",sentence:"Come and read with me."},
    {text:"some",chunks:["s","o","me"],cue:"This is a heart word. The middle vowel sounds like the vowel in up. The final letter is silent. Listen to the whole word and try it.",sentence:"We read some words."},
    {text:"where",chunks:["wh","ere"],cue:"This is a question word. Listen to the whole word. It rhymes with bear.",sentence:"Where is my book?",aliases:["wear","ware"]},
    {text:"there",chunks:["th","ere"],cue:"Rest your tongue lightly between your teeth and gently buzz your throat, like the start of this. The rest of the word rhymes with air. Blend them: there.",sentence:"The book is over there.",aliases:["their","they're"]},
  ],
};
export function isWordMatch(transcript: string, word: Word): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/[.!?,;:]/g, "").replace(/\s+/g," ").trim();
  const text=clean(transcript);
  // Some isolated words need context. Allow only explicit reading phrases,
  // never arbitrary sentences that merely contain the answer or fuzzy spellings.
  const answer=text.replace(/^(?:the word is |it is |it's |it’s )/,"");
  return [word.text,...(word.aliases??[])].some(w=>clean(w)===answer);
}
const sentence = (text: string, phrases: string[]): Sentence => ({
  kind: "sentence", text, phrases,
  cue: `Read in little groups. ${phrases.join(". ")}.`,
});
export const sentenceSets: Record<string, Sentence[]> = {
  "Sentence Pond": [
    sentence("The cat is on the mat.", ["The cat", "is on the mat"]),
    sentence("I can hop like a frog.", ["I can hop", "like a frog"]),
    sentence("The sun is warm today.", ["The sun", "is warm today"]),
    sentence("A little duck swims in the pond.", ["A little duck", "swims in the pond"]),
    sentence("We plant a seed in the garden.", ["We plant a seed", "in the garden"]),
    sentence("My red boat floats on the water.", ["My red boat", "floats on the water"]),
    sentence("The green frog jumps over a log.", ["The green frog", "jumps over a log"]),
    sentence("I like to read with my friend.", ["I like to read", "with my friend"]),
  ],
  "Sentence Scramble": [
    sentence("The frog can jump.", ["The frog", "can jump"]),
    sentence("I see a red bird.", ["I see", "a red bird"]),
    sentence("We read a book.", ["We read", "a book"]),
    sentence("The sun is bright.", ["The sun", "is bright"]),
    sentence("A fish swims in the pond.", ["A fish swims", "in the pond"]),
    sentence("My friend has a green hat.", ["My friend", "has a green hat"]),
  ],
  "Story Trail": [
    sentence("A frog finds a little book.", ["A frog finds", "a little book"]),
    sentence("The book is under a leaf.", ["The book", "is under a leaf"]),
    sentence("The frog sits by the pond.", ["The frog sits", "by the pond"]),
    sentence("He reads about a brave duck.", ["He reads about", "a brave duck"]),
    sentence("The duck helps a lost fish.", ["The duck helps", "a lost fish"]),
    sentence("The frog shares the book with a friend.", ["The frog shares the book", "with a friend"]),
  ],
};
export function practiceItems(activity: string): ReadingItem[] {
  return sentenceSets[activity] ?? wordSets[activity] ?? [];
}
export function sentenceWords(text: string): string[] {
  return text.toLowerCase().replace(/[’‘]/g, "'").match(/[a-z0-9]+(?:'[a-z0-9]+)*/g) ?? [];
}
export function isSentenceMatch(transcript: string, target: string): boolean {
  const answer = sentenceWords(transcript);
  const expected = sentenceWords(target);
  return expected.length > 0 && answer.length === expected.length && answer.every((word, i) => word === expected[i]);
}
/** Keep a correct prefix across reading pauses; a mistake requires a fresh attempt. */
export function checkSentenceAttempt(transcript: string, target: string, previous: string[] = []): { status: "complete" | "partial" | "retry"; words: string[] } {
  const expected = sentenceWords(target);
  const heard = sentenceWords(transcript);
  const prefix = (words: string[]) => words.length <= expected.length && words.every((word, i) => word === expected[i]);
  if (!heard.length || !expected.length) return { status: "retry", words: [] };
  const continued = [...previous, ...heard];
  const words = prefix(previous) && prefix(continued) ? continued : prefix(heard) ? heard : [];
  return { status: words.length === expected.length ? "complete" : words.length ? "partial" : "retry", words };
}
export function sentenceTiles(text: string): { id: number; text: string }[] {
  const tiles = text.split(/\s+/).map((text, id) => ({ id, text }));
  let seed = [...text].reduce((n, letter) => ((n * 31) + letter.charCodeAt(0)) >>> 0, 7);
  for (let i = tiles.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1); [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  if (tiles.length > 1 && tiles.every((tile, i) => tile.id === i)) tiles.push(tiles.shift()!);
  return tiles;
}
export type ReadingRecord = {word: string; activity: string; at: string; source: "speech" | "parent"; kind?: "word" | "sentence"};
export function countReadWords(records: ReadingRecord[]): number {
  return records.reduce((count, record) => count + (record.kind === "sentence" ? sentenceWords(record.word).length : 1), 0);
}
export type Settings = {sound: boolean; assisted: boolean; voice: "natural" | "device"; recognition: "careful" | "quick"};
export const defaultSettings: Settings = { sound: true, assisted: false, voice: "natural", recognition: "careful" };
export function readSettings(value: unknown): Settings {
  if (!value || typeof value !== "object") return { ...defaultSettings };
  const saved = value as Partial<Settings>;
  return {
    sound: typeof saved.sound === "boolean" ? saved.sound : true,
    assisted: saved.assisted === true,
    voice: saved.voice === "device" ? "device" : "natural",
    recognition: saved.recognition === "quick" ? "quick" : "careful",
  };
}
export function localDay(date = new Date()) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
