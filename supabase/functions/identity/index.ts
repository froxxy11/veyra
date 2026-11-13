import {hash,encode64,verifySignature} from './crypto.mjs';
const URL=Deno.env.get('SUPABASE_URL')!, KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ORIGIN='https://veyra-six-weld.vercel.app', RECIPIENT='veyra-six-weld.vercel.app', CALLBACK=ORIGIN+'/';
async function db(path:string,method='GET',body?:unknown){const r=await fetch(URL+'/rest/v1/'+path,{method,headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error('Database operation rejected');return d}
async function session(token:string){if(!token||token.length>200)return null;const rows=await db('veyra_sessions?token_hash=eq.'+await hash(token)+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString()));return rows[0]||null}
Deno.serve(async req=>{const headers={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'content-type,apikey,authorization','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.headers.get('origin')!==ORIGIN)return reply({error:'Origin rejected'},403);if(req.method==='OPTIONS')return new Response(null,{headers});if(req.method!=='POST')return reply({error:'Method rejected'},405);
 try{if(Number(req.headers.get('content-length')||0)>12000)throw Error('Request too large');const raw=await req.text();if(raw.length>12000)throw Error('Request too large');const b=JSON.parse(raw);const current=await session(b.session);const token=encode64(crypto.getRandomValues(new Uint8Array(32))),tokenHash=await hash(token);
 if(b.action==='email'){
  if(typeof b.access_token!=='string')throw Error('Email authentication required');
  const r=await fetch(URL+'/auth/v1/user',{headers:{apikey:KEY,Authorization:'Bearer '+b.access_token}});const u=await r.json();if(!r.ok||!u.email_confirmed_at)throw Error('Verify your email before signing in.');
  if(b.link&&(!current||Date.now()-Date.parse(current.created_at)>600000))throw Error('Sign in again before linking your email.');
  await db('rpc/veyra_email_login','POST',{uid:u.id,linked_owner:b.link?current.owner_id:null,new_hash:tokenHash});return reply({token});
 }
 if(b.action==='challenge'){
  if(b.link&&(!current||Date.now()-Date.parse(current.created_at)>600000))throw Error('Sign in again before linking a wallet.');
  const ip=await hash((req.headers.get('x-forwarded-for')||'unknown')+KEY);const recent=await db('veyra_challenges?select=id&ip_hash=eq.'+ip+'&created_at=gt.'+encodeURIComponent(new Date(Date.now()-300000).toISOString()));if(recent.length>=15)return reply({error:'Too many requests. Try again in five minutes.'},429);
  const proof=encode64(crypto.getRandomValues(new Uint8Array(32))),nonce=encode64(crypto.getRandomValues(new Uint8Array(32)));
  const message=(b.link?'Link this NEAR wallet to your signed-in Veyra account.':'Sign in to Veyra.')+' No transaction, payment, or access key will be requested. Challenge '+crypto.randomUUID();
  const rows=await db('veyra_challenges','POST',{nonce,browser_hash:await hash(proof),ip_hash:ip,owner_id:b.link?current.owner_id:null,message});return reply({id:rows[0].id,proof,nonce,message,recipient:RECIPIENT,callbackUrl:CALLBACK});
 }
 if(b.action==='wallet'){
  if(!/^[a-z0-9][a-z0-9._-]{0,62}[a-z0-9]$/.test(b.accountId||''))throw Error('Invalid NEAR account');
  if(!/^[0-9a-f-]{36}$/.test(b.id||''))throw Error('Invalid challenge');
  const rows=await db('veyra_challenges?id=eq.'+b.id+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString()));const c=rows[0];if(!c||await hash(b.proof||'')!==c.browser_hash)throw Error('Challenge expired or invalid.');
  if(!await verifySignature({...b,message:c.message,nonce:c.nonce,recipient:RECIPIENT,callback:CALLBACK}))throw Error('Invalid wallet signature');
  const rpc=await fetch('https://rpc.mainnet.near.org',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'veyra-auth',method:'query',params:{request_type:'view_access_key',finality:'final',account_id:b.accountId,public_key:b.publicKey}}),signal:AbortSignal.timeout(10000)});const key=await rpc.json();if(key.result?.permission!=='FullAccess')throw Error('Signature must use a current full-access key belonging to this account.');
  await db('rpc/veyra_wallet_login','POST',{challenge_id:c.id,proof_hash:c.browser_hash,wallet_id:b.accountId,new_hash:tokenHash});return reply({token});
 }
 if(b.action==='traders'){const traders=await db('veyra_accounts?contact_public=eq.true&select=display_name,bio,contact_method,contact_value&order=display_name.asc,id.asc&limit=50');return reply({traders})}
 if(!current)return reply({error:'Sign in required'},401);
 if(b.action==='claim'){const attempt=await db('rpc/veyra_claim_credits','POST',{owner:current.owner_id});return reply({attempt})}
 if(b.action==='logout'){await db('veyra_sessions?token_hash=eq.'+await hash(b.session),'DELETE');return reply({ok:true})}
 if(b.action==='profile'&&b.update){const name=String(b.update.display_name||'').trim();if(!name||name.length>40)throw Error('Display name must be 1–40 characters');const method=String(b.update.contact_method||''), value=String(b.update.contact_value||'').trim(), visible=b.update.contact_public===true;
 if(!['','Email','Telegram','X','Other'].includes(method)||value.length>160||(visible&&(!method||!value)))throw Error('Choose a contact method and provide contact details before publishing.');
 await db('veyra_accounts?id=eq.'+current.owner_id,'PATCH',{display_name:name,bio:String(b.update.bio||'').slice(0,240),contact_method:method,contact_value:value,contact_public:visible})}
 if(b.action==='profile'){const rows=await db('veyra_accounts?id=eq.'+current.owner_id+'&select=id,display_name,bio,auth_user_id,funding_attempt,contact_method,contact_value,contact_public');const p=rows[0];const wallets=await db('veyra_wallets?owner_id=eq.'+current.owner_id+'&select=account_id');return reply({profile:{id:p.id,display_name:p.display_name,bio:p.bio,emailLinked:!!p.auth_user_id,fundingAttempt:p.funding_attempt,contactMethod:p.contact_method,contactValue:p.contact_value,contactPublic:p.contact_public,wallets:wallets.map((w:{account_id:string})=>w.account_id)}})}
 throw Error('Unknown action');
 }catch(e){return reply({error:e instanceof Error?e.message:'Request rejected'},400)}
});
