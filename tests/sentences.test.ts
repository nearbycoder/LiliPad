import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSentenceAttempt, countReadWords, isSentenceMatch, practiceItems, sentenceSets, sentenceTiles, sentenceWords, type ReadingRecord } from '../lib/reading.ts';
const target='The cat is on the mat.';
test('sentence matching ignores case, punctuation, and whitespace',()=>{
 for(const text of ['THE CAT IS ON THE MAT!','The cat, is on the mat',' the   cat is on the mat. '])assert.equal(isSentenceMatch(text,target),true);
 assert.equal(isSentenceMatch("It's my book.","It’s my book!"),true);
});
test('sentences require every word in order, rejecting omissions, substitutions, negation and extras',()=>{
 for(const text of ['', 'cat','The cat on the mat','The cat is under the mat','The cat is not on the mat','The mat is on the cat','The cat is on the mat and sleeps','The word is the cat is on the mat'])assert.equal(isSentenceMatch(text,target),false,text);
});
test('pauses preserve a correct prefix but never count it as a whole sentence',()=>{
 const first=checkSentenceAttempt('The cat',target);
 assert.deepEqual(first,{status:'partial',words:['the','cat']});
 const second=checkSentenceAttempt('is on',target,first.words);
 assert.equal(second.status,'partial');
 assert.equal(checkSentenceAttempt('the mat.',target,second.words).status,'complete');
});
test('a fresh full sentence can restart an unfinished attempt',()=>{
 const partial=checkSentenceAttempt('The cat',target);
 assert.equal(checkSentenceAttempt(target,target,partial.words).status,'complete');
 assert.deepEqual(checkSentenceAttempt('The cat is',target,partial.words),{status:'partial',words:['the','cat','is']});
});
test('an incorrect fragment clears the prefix and cannot earn credit from the remainder',()=>{
 const first=checkSentenceAttempt('The cat',target);
 const wrong=checkSentenceAttempt('is under',target,first.words);
 assert.deepEqual(wrong,{status:'retry',words:[]});
 assert.equal(checkSentenceAttempt('the mat',target,wrong.words).status,'retry');
 assert.equal(checkSentenceAttempt('is on the mat',target,['a','dog']).status,'retry');
});
test('all sentence games have valid phrase hints, unique rounds and strict complete matches',()=>{
 for(const [activity,items] of Object.entries(sentenceSets)){
   assert.equal(practiceItems(activity),items);
   assert.equal(new Set(items.map(item=>item.text)).size,items.length);
   for(const item of items){
     assert.equal(isSentenceMatch(item.phrases.join(' '),item.text),true);
     assert.ok(sentenceWords(item.text).length>=3);
     assert.equal(checkSentenceAttempt(item.text,item.text).status,'complete');
   }
 }
});
test('scrambled tiles keep duplicate words independent and preserve all sentence words',()=>{
 const tiles=sentenceTiles(target);
 assert.equal(new Set(tiles.map(tile=>tile.id)).size,6);
 assert.deepEqual(tiles.slice().sort((a,b)=>a.id-b.id).map(tile=>tile.text),target.split(' '));
 assert.ok(tiles.some((tile,i)=>tile.id!==i));
 assert.deepEqual(sentenceTiles(target),tiles);
});
test('legacy word progress survives alongside sentence records and stars stay one per record',()=>{
 const records:ReadingRecord[]=[{word:'cat',activity:'Word Hop',at:'2026-10-01T12:00:00Z',source:'speech'},{word:target,activity:'Sentence Pond',at:'2026-10-01T12:01:00Z',source:'parent',kind:'sentence'}];
 assert.equal(countReadWords(records),7);
 assert.equal(records.length,2);
});
