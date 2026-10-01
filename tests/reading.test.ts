import test from 'node:test';
import assert from 'node:assert/strict';
import {isWordMatch,wordSets,readSettings} from '../lib/reading.ts';
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
test('thin is distinct from other consonants and vowels, including proper-name transcripts',()=>{
 const thin=wordSets['Sound Safari'].find(word=>word.text==='thin')!;
 for(const text of ['Thin.','THIN!',' thin '])assert.equal(isWordMatch(text,thin),true);
 for(const text of ['fin','Finn.','tin','then','thing','think','thin fin','thin is thin'])assert.equal(isWordMatch(text,thin),false);
});
test('all adventures match their own words and reject every other practice word',()=>{
 const words=Object.values(wordSets).flat();
 for(const word of words)for(const other of words)assert.equal(isWordMatch(other.text,word),word.text===other.text);
});
test('explicit reading phrases supply context without admitting wrong words or negation',()=>{
 const thin=wordSets['Sound Safari'].find(word=>word.text==='thin')!;
 for(const text of ['The word is thin.','It is thin.','It’s thin.','it\'s thin'])assert.equal(isWordMatch(text,thin),true);
 for(const text of ['The word is fin.','The word is tin.','It is then.','It is not thin.','The word is not thin.','I said fin, not thin','The thin cat'])assert.equal(isWordMatch(text,thin),false);
});
test('old settings preserve existing preferences and add natural voice and careful listening',()=>{
 assert.deepEqual(readSettings({sound:false,assisted:true}),{sound:false,assisted:true,voice:'natural',recognition:'careful'});
 assert.deepEqual(readSettings({sound:true,voice:'device',recognition:'quick'}),{sound:true,assisted:false,voice:'device',recognition:'quick'});
});
