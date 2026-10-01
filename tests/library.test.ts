import test from 'node:test';
import assert from 'node:assert/strict';
import { wordSets, sentenceSets, practiceRound, readLibraryPositions, type ReadingRecord } from '../lib/reading.ts';

test('each word option has 600 distinct items with usable hints and preserved opening words',()=>{
  for(const [activity,words] of Object.entries(wordSets)) {
    assert.equal(words.length,600,activity);
    assert.equal(new Set(words.map(word=>word.text.toLowerCase())).size,600);
    for(const word of words) {
      assert.match(word.text,/^[a-z]+$/i);
      assert.ok(word.cue.length>20);
      assert.equal(word.chunks.join(''),word.text);
      assert.ok(word.sentence);
    }
  }
  assert.deepEqual(Object.values(wordSets).map(words=>words[0].text),['cat','ship','the']);
});
test('sentence options contain 600 sentences and 101 complete connected stories',()=>{
  assert.equal(sentenceSets['Sentence Pond'].length,600);
  assert.equal(sentenceSets['Sentence Scramble'].length,600);
  const stories=sentenceSets['Story Trail'];
  assert.equal(stories.length,606);
  const titles=new Set<string>();
  for(let i=0;i<stories.length;i+=6){
    const chapter=stories.slice(i,i+6);
    assert.equal(new Set(chapter.map(line=>line.storyTitle)).size,1);
    assert.ok(chapter[0].storyTitle);
    titles.add(chapter[0].storyTitle!);
  }
  assert.equal(titles.size,101);
});
test('short batches move through the library and wrap only after its end',()=>{
  for(const [activity,size] of [['Word Hop',10],['Sound Safari',10],['Sight Word Stars',10],['Sentence Pond',8],['Sentence Scramble',6]] as const){
    const first=practiceRound(activity);const next=practiceRound(activity,size);
    assert.equal(first.items.length,size);
    assert.equal(next.items.length,size);
    assert.notEqual(first.items[0].text,next.items[0].text);
    assert.equal(practiceRound(activity,599).items.length,1);
    assert.equal(practiceRound(activity,600).items[0].text,first.items[0].text);
  }
});
test('resuming a story never blends its ending into another story',()=>{
  assert.equal(practiceRound('Story Trail',4).items.length,2);
  const next=practiceRound('Story Trail',6);
  assert.equal(next.items.length,6);
  assert.equal(new Set(next.items.map(item=>item.kind==='sentence'&&item.storyTitle)).size,1);
  assert.notEqual(next.items[0].text,practiceRound('Story Trail').items[0].text);
  assert.equal(practiceRound('Story Trail',605).items.length,1);
  assert.equal(practiceRound('Story Trail',606).items[0].text,practiceRound('Story Trail').items[0].text);
});
test('saved positions survive and old progress migrates independently per activity',()=>{
  const records:ReadingRecord[]=[{word:'sun',activity:'Word Hop',at:'2026-10-01T12:00:00Z',source:'speech'},{word:'thin',activity:'Sound Safari',at:'2026-10-01T12:00:00Z',source:'speech'}];
  const migrated=readLibraryPositions(null,records);
  assert.equal(migrated['Word Hop'],2);
  assert.equal(migrated['Sound Safari'],4);
  assert.equal(migrated['Sentence Pond'],0);
  const restored=readLibraryPositions({'Word Hop':125,'Sound Safari':604,'Story Trail':606},records);
  assert.equal(restored['Word Hop'],125);
  assert.equal(restored['Sound Safari'],604);
  assert.equal(restored['Story Trail'],606);
  for(const invalid of [-1,1.5,NaN,Infinity,'20',Number.MAX_SAFE_INTEGER])assert.equal(readLibraryPositions({'Word Hop':invalid},records)['Word Hop'],2);
});
