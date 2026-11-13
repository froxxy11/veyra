import {createAttempt,buy,settle,evaluate,policy} from './engine.js';
export function replay(){
 const start=Date.UTC(2026,9,1), day=86400000, a=createAttempt('silver-synthetic-v1',start);
 for(let i=0;i<15;i++){
  const timestamp=start+Math.floor(i/2)*day, id='synthetic-'+(i+1);
  a.dayStart=a.equity;
  buy(a,{id,event:id,title:'Synthetic event '+(i+1),ask:.5,depth:1000,timestamp},100,timestamp);
  settle(a,id,i<12?1:0);
 }
 const result=evaluate(a,start+14*day);
 return {schema:'veyra-demo-v1',fixture:a.id,policy:policy.version,synthetic:true,starting:a.starting??10000,ending:a.equity,events:a.settled.length,activeDays:a.days.length,elapsedDays:14,checks:result.checks,pass:result.pass};
}
export async function fingerprint(report){
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(report)))),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function verifyAnchor(anchor,report){
 const digest=await fingerprint(report);
 if(digest!==anchor.sha256)throw Error('Report fingerprint does not match the published proof.');
 const response=await fetch('https://rpc.testnet.near.org',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),body:JSON.stringify({jsonrpc:'2.0',id:'veyra',method:'tx',params:{tx_hash:anchor.txHash,sender_account_id:anchor.account,wait_until:'FINAL'}})});
 const {result}=await response.json(), tx=result?.transaction;
 if(!response.ok||result?.final_execution_status!=='FINAL'||result?.status?.SuccessValue===undefined||tx?.hash!==anchor.txHash||tx.signer_id!==anchor.account||tx.receiver_id!==anchor.account)throw Error('A successful final testnet transaction could not be confirmed.');
 const match=tx.actions.some(({FunctionCall:c})=>{
  if(c?.method_name!=='record')return false;
  try{const args=JSON.parse(atob(c.args));return args.schema===report.schema&&args.sha256===digest}catch{return false}
 });
 if(!match)throw Error('The transaction does not contain this report fingerprint.');
 return digest;
}
