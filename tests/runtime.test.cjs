const {test}=require('node:test');const assert=require('node:assert/strict');const {fixedStep,storage}=require('../runtime.js');
for(const hz of [30,60,120,144])test(`simulation runs 600 updates in ten seconds at ${hz} Hz`,()=>{let n=0;const tick=fixedStep(()=>n++);for(let i=0;i<=hz*10;i++)tick(i*1000/hz);assert.equal(n,600)});
test('background gap does not fast-forward the game',()=>{let n=0;const tick=fixedStep(()=>n++);tick(0);tick(10000);assert.equal(n,0);tick(10000+1000/60);assert.equal(n,1)});
test('storage fallback supports read/write/remove',()=>{const s=storage('missingStorage');s.setItem('test',42);assert.equal(s.getItem('test'),'42');s.removeItem('test');assert.equal(s.getItem('test'),null)});
