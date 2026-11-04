const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58(s){let n=0n;for(const c of s){const x=alphabet.indexOf(c);if(x<0)throw Error('Invalid public key');n=n*58n+BigInt(x)}const bytes=[];while(n){bytes.unshift(Number(n&255n));n>>=8n}for(const c of s){if(c!=='1')break;bytes.unshift(0)}return new Uint8Array(bytes)}
export const decode64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export const encode64=b=>btoa(String.fromCharCode(...b));
export async function hash(s){const b=typeof s==='string'?new TextEncoder().encode(s):s;return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function u32(n){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,true);return b}
function str(s){const b=new TextEncoder().encode(s);return [u32(b.length),b]}
export function payload(message,nonce,recipient,callback){if(nonce.length!==32)throw Error('Invalid nonce');const parts=[u32(2147484061),...str(message),nonce,...str(recipient),new Uint8Array([callback?1:0]),...(callback?str(callback):[])];const b=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){b.set(p,i);i+=p.length}return b}
export async function verifySignature({message,nonce,recipient,callback,publicKey,signature}){if(!publicKey.startsWith('ed25519:'))return false;const key=base58(publicKey.slice(8));const sig=decode64(signature);if(key.length!==32||sig.length!==64)return false;const digest=await crypto.subtle.digest('SHA-256',payload(message,decode64(nonce),recipient,callback));return crypto.subtle.verify('Ed25519',await crypto.subtle.importKey('raw',key,'Ed25519',false,['verify']),sig,digest)}
