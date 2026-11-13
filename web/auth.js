const BASE='https://sfvzaibhmprsnzzurxns.supabase.co',KEY='sb_publishable_RVgH0a3qN53RcN-I71KbbQ_iXCG5gDp';
const ENDPOINT=BASE+'/functions/v1/identity';let profile=null,connector=null;
export const currentProfile=()=>profile;
export async function identity(action,data={}){const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY},body:JSON.stringify({action,session:sessionStorage.getItem('veyra-session'),...data})});const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d;}
async function accept(token){sessionStorage.setItem('veyra-session',token);profile=(await identity('profile')).profile;window.dispatchEvent(new Event('veyra-auth'));return profile}
export async function restore(){if(!sessionStorage.getItem('veyra-session'))return null;try{profile=(await identity('profile')).profile;return profile}catch{sessionStorage.removeItem('veyra-session');return null}}
async function emailRequest(path,body){const r=await fetch(BASE+'/auth/v1/'+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.msg||d.error_description||d.message||'Email request failed');return d}
export async function emailLogin(email,password,link=false){const d=await emailRequest('token?grant_type=password',{email,password});const result=await identity('email',{access_token:d.access_token,link});await accept(result.token);}
export async function emailSignup(email,password){return emailRequest('signup',{email,password});}
export async function saveAccount(display_name,bio,contact){profile=(await identity('profile',{update:{display_name,bio,...contact}})).profile;window.dispatchEvent(new Event('veyra-auth'))}
export async function logout(){try{await identity('logout')}finally{profile=null;sessionStorage.removeItem('veyra-session');window.dispatchEvent(new Event('veyra-auth'))}}
export async function walletLogin(link=false){const c=await identity('challenge',{link});sessionStorage.setItem('veyra-wallet-challenge',JSON.stringify(c));await initConnector();
 await connector.connect({signMessageParams:{message:c.message,recipient:c.recipient,nonce:Uint8Array.from(atob(c.nonce),x=>x.charCodeAt(0)),callbackUrl:c.callbackUrl,state:c.id}});
}
async function initConnector(){if(!connector){const {NearConnector}=await import('https://esm.sh/@hot-labs/near-connect@0.12.0');connector=new NearConnector({network:'mainnet',features:{signMessage:true}});connector.on('wallet:signInAndSignMessage',async event=>{try{const saved=JSON.parse(sessionStorage.getItem('veyra-wallet-challenge')||'null');if(!saved)throw Error('Wallet challenge expired. Please try again.');const account=event.accounts[0];const signed=account.signedMessage;if(!signed)throw Error('Wallet did not return a signature');const d=await identity('wallet',{id:saved.id,proof:saved.proof,...signed,accountId:account.accountId});sessionStorage.removeItem('veyra-wallet-challenge');await accept(d.token)}catch(e){window.dispatchEvent(new CustomEvent('veyra-auth-error',{detail:e.message}))}})}
}

if(sessionStorage.getItem("veyra-wallet-challenge"))initConnector().catch(()=>window.dispatchEvent(new CustomEvent("veyra-auth-error",{detail:"Wallet return could not be restored. Please sign in again."})));

export async function claimCredits(){const d=await identity("claim");profile=(await identity("profile")).profile;return d.attempt}
