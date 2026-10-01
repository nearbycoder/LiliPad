import test from 'node:test';
import assert from 'node:assert/strict';
import {isWordMatch,wordSets} from '../lib/reading.ts';
test('whole word matching ignores case and punctuation',()=>{
 const word=wordSets['Word Hop'][0];
 for(const text of ['cat','Cat.',' CAT! '])assert.equal(isWordMatch(text,word),true);
});
test('wrong, partial, empty, and multiword answers never advance',()=>{
 const word=wordSets['Word Hop'][0];
 for(const text of ['','ca','cats','cap','cat dog','the cat','concatenate'])assert.equal(isWordMatch(text,word),false);
});
test('a spoken homophone is accepted without fuzzy word matching',()=>{
 const sun=wordSets['Word Hop'][1];
 assert.equal(isWordMatch('Son.',sun),true);
 assert.equal(isWordMatch('soon',sun),false);
 assert.equal(isWordMatch('son and cat',sun),false);
});
