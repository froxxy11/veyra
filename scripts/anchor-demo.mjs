// Testnet-only publisher. The tiny WASM exports a no-op; the immutable
// commitment lives in the successful transaction's function call arguments.
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {replay,fingerprint} from '../web/replay.js';
const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58(b){let n=BigInt('0x'+b.toString('hex')),s='';while(n){s=alphabet[Number(n%58n)]+s;n/=58n}for(const x of b){if(x)break;s='1'+s}return s}
function un58(s){let n=0n;for(const c of s)n=n*58n+BigInt(alphabet.indexOf(c));const h=n.toString(16);return Buffer.concat([Buffer.alloc(s.match(/^1*/)[0].length),Buffer.from(h.padStart(h.length+h.length%2,'0'),'hex')])}
const post=async(url,data)=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(25000)});const s=await r.text();if(!r.ok)throw Error('HTTP '+r.status+': '+s.slice(0,300));return JSON.parse(s)};
const rpc=async(method,params)=>{const d=await post('https://rpc.testnet.near.org',{jsonrpc:'2.0',id:'veyra',method,params});if(d.error)throw Error(JSON.stringify(d.error));return d.result};
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const pk=publicKey.export({type:'spki',format:'der'}).subarray(-32);
const account='veyra-demo-'+Date.now().toString(36)+'.testnet';
await post('https://helper.testnet.near.org/account',{newAccountId:account,newAccountPublicKey:'ed25519:'+b58(pk)});
const key=await rpc('query',{request_type:'view_access_key',finality:'optimistic',account_id:account,public_key:'ed25519:'+b58(pk)});
const u32=n=>{const b=Buffer.alloc(4);b.writeUInt32LE(n);return b},u64=n=>{const b=Buffer.alloc(8);b.writeBigUInt64LE(BigInt(n));return b};
const vec=x=>{const b=Buffer.from(x);return Buffer.concat([u32(b.length),b])};
const wasm=Buffer.from('0061736d0100000001040160000003020100070a01067265636f726400000a040102000b','hex');
const sha256=await fingerprint(replay());
const tx=Buffer.concat([vec(account),Buffer.from([0]),pk,u64(BigInt(key.nonce)+1n),vec(account),un58(key.block_hash),u32(2),Buffer.from([1]),vec(wasm),Buffer.from([2]),vec('record'),vec(JSON.stringify({schema:'veyra-demo-v1',sha256})),u64(10000000000000n),Buffer.alloc(16)]);
const hash=createHash('sha256').update(tx).digest(), txHash=b58(hash);
const result=await rpc('send_tx',{signed_tx_base64:Buffer.concat([tx,Buffer.from([0]),sign(null,hash,privateKey)]).toString('base64'),wait_until:'FINAL'});
if(result.final_execution_status!=='FINAL'||result.status?.SuccessValue===undefined||result.transaction?.hash!==txHash)throw Error('Anchor not finalized successfully: '+txHash+' '+account);
await writeFile(new URL('../web/demo-anchor.json',import.meta.url),JSON.stringify({account,txHash,sha256},null,2)+'\n');
console.log(account,txHash,sha256);
