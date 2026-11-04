export const policy = Object.freeze({version:'silver-v1-draft',starting:10000,profit:800,days:14,activeDays:7,events:15,drawdown:.10,daily:.05,eventExposure:1000,totalExposure:4000,concentration:.30});
export function createAttempt(id,now=Date.now()){return {id,started:now,status:'active',cash:10000,equity:10000,peak:10000,dayStart:10000,positions:[],settled:[],days:[],reason:null};}
export function buy(a,market,cost,now=Date.now()){
 if(a.status!=='active')throw Error('Claim an active evaluation first.');
 if(!Number.isFinite(cost)||cost<=0||cost>a.cash)throw Error('Invalid amount or insufficient credits.');
 if(market.closed||now-market.timestamp>60000)throw Error('Market pricing is unavailable or stale.');
 const exposure=a.positions.reduce((s,p)=>s+p.cost,0);
 if(exposure+cost>policy.totalExposure)throw Error('Maximum total exposure is 4,000 credits.');
 if(a.positions.filter(p=>p.event===market.event).reduce((s,p)=>s+p.cost,0)+cost>1000)throw Error('Maximum exposure per event is 1,000 credits.');
 if(cost>market.depth)throw Error('Insufficient simulated liquidity.');
 a.cash-=cost;a.positions.push({id:crypto.randomUUID(),market:market.id,event:market.event,title:market.title,cost,shares:cost/market.ask});
 const day=new Date(now).toISOString().slice(0,10);if(!a.days.includes(day))a.days.push(day);return a;
}
export function settle(a,market,payout){
 if(a.status!=='active')throw Error('This attempt is closed.');
 if(!Number.isFinite(payout)||payout<0||payout>1)throw Error('Invalid payout.');
 const positions=a.positions.filter(p=>p.market===market);if(!positions.length)return a;
 for(const p of positions){a.cash+=p.shares*payout;a.settled.push({...p,pnl:p.shares*payout-p.cost});}
 a.positions=a.positions.filter(p=>p.market!==market);mark(a,a.cash+a.positions.reduce((s,p)=>s+p.cost,0));return a;
}
export function mark(a,equity){if(a.status!=='active')return a;a.equity=equity;a.peak=Math.max(a.peak,equity);if(equity<a.peak*.9||equity<a.dayStart*.95){a.status='failed';a.reason=equity<a.peak*.9?'Maximum drawdown exceeded':'Daily loss limit exceeded';a.cash=0;a.positions=[];}return a;}
export function evaluate(a,now=Date.now()){
 const profits={};for(const p of a.settled)profits[p.event]=(profits[p.event]||0)+p.pnl;
 const positive=Object.values(profits).filter(x=>x>0),sum=positive.reduce((s,x)=>s+x,0);
 const checks={profit:a.equity>=10800,duration:now-a.started>=14*86400000,events:Object.keys(profits).length>=15,activeDays:a.days.length>=7,concentration:sum>0&&Math.max(...positive)/sum<=.3,closed:a.positions.length===0,risk:a.status==='active'};
 return {checks,pass:Object.values(checks).every(Boolean)};
}
