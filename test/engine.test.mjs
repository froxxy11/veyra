import {test} from 'node:test';import assert from 'node:assert/strict';import {createAttempt,buy,settle,evaluate,mark} from '../core/engine.mjs';
const market=()=>({id:'a',event:'a',title:'Synthetic',ask:.5,depth:1000,timestamp:Date.now()});
test('exposure rejection leaves funds intact',()=>{const a=createAttempt('x');buy(a,market(),900);assert.throws(()=>buy(a,market(),101));assert.equal(a.cash,9100)});
test('stale data cannot fill an order',()=>{const a=createAttempt('x');assert.throws(()=>buy(a,{...market(),timestamp:0},100));assert.equal(a.cash,10000)});
test('settlement is idempotent and cannot credit failed attempts',()=>{const a=createAttempt('x');buy(a,market(),100);settle(a,'a',1);settle(a,'a',1);assert.equal(a.cash,10100);mark(a,8000);assert.equal(a.cash,0);assert.throws(()=>settle(a,'a',1))});
test('profit alone cannot earn rank',()=>{const a=createAttempt('x');a.equity=11000;assert.equal(evaluate(a).pass,false)});
test('a qualifying history satisfies every gate',()=>{const a=createAttempt('x',Date.now()-15*86400000);a.equity=10900;a.days=Array.from({length:7},(_,i)=>String(i));a.settled=Array.from({length:15},(_,i)=>({event:String(i),pnl:60}));assert.equal(evaluate(a).pass,true)});
test('NO position pays on a NO result',()=>{const a=createAttempt('no');buy(a,market(),100);a.positions[0].side='no';settle(a,'a',0);assert.equal(a.cash,10100)});
