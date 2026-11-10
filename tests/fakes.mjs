// In-memory stand-ins for IndexedDB and Supabase, used by the Node tests.
export function installFakeIDB(){const dbs=new Map();
 const obj=d=>({objectStoreNames:{contains:n=>d.stores.has(n)},createObjectStore(n){d.stores.set(n,new Map())},
  transaction(names){names=[].concat(names);const t={};let pend=0,fin=false;const chk=()=>setTimeout(()=>{if(pend===0&&!fin){fin=true;t.oncomplete&&t.oncomplete()}},0);
   const wrap=n=>{const s=d.stores.get(n);const op=fn=>{pend++;const r={};setTimeout(()=>{try{r.result=fn()}catch(e){r.error=e}if(!r.error)r.onsuccess&&r.onsuccess();else r.onerror&&r.onerror();pend--;chk()},0);return r};
    return {put:(v,k)=>(s.set(k,structuredClone(v)),op(()=>k)),get:k=>op(()=>s.has(k)?structuredClone(s.get(k)):undefined),delete:k=>(s.delete(k),op(()=>undefined)),getAll:()=>op(()=>[...s.values()].map(v=>structuredClone(v))),getAllKeys:()=>op(()=>[...s.keys()])}};
   t.objectStore=n=>wrap(n);setTimeout(chk,0);return t}});
 globalThis.indexedDB={open(name,ver){const req={};setTimeout(()=>{let d=dbs.get(name);if(!d||d.version<ver){d={version:ver,stores:d?d.stores:new Map()};dbs.set(name,d);req.result=obj(d);req.onupgradeneeded&&req.onupgradeneeded()}else req.result=obj(d);req.onsuccess&&req.onsuccess()},0);return req}};
 return {dbs,stores:()=>dbs.get('digbuild')?.stores,
  // simulate the OLD (Stage 4) app: db version 1 with a single "worlds" store keyed 'world-<seed>'
  seedLegacy(entries){const d={version:1,stores:new Map([['worlds',new Map(Object.entries(entries).map(([k,v])=>[k,structuredClone(v)]))]])};dbs.set('digbuild',d)}}}
// Minimal Supabase client with Row Level Security (a user only sees/changes rows where user_id = their id) and the unique(user_id,name) / unique(user_id,world_id) rules.
export function makeSupabase(){const rows=[],cur={id:null},st={offline:false};let seq=1;
 const uniq=(r,except)=>rows.find(x=>x!==except&&x.user_id===r.user_id&&(x.name===r.name||(r.world_id&&x.world_id===r.world_id)));
 class Q{constructor(){this.f=[];this.op='select';this.single=false}
  select(c){this.op='select';this.cols=c;return this}eq(c,v){this.f.push(r=>r[c]===v);return this}is(c,v){this.f.push(r=>(r[c]??null)===v);return this}
  upsert(o,opt){this.op='upsert';this.obj=o;this.conf=opt&&opt.onConflict;return this}update(o){this.op='update';this.obj=o;return this}delete(){this.op='delete';return this}maybeSingle(){this.single=true;return this}
  then(res,rej){return Promise.resolve().then(()=>this.run()).then(res,rej)}
  run(){if(st.offline)return {data:null,error:{message:'network down'}};if(!cur.id)return {data:null,error:{message:'not logged in'}};
   const mine=rows.filter(r=>r.user_id===cur.id&&this.f.every(f=>f(r)));
   if(this.op==='select'){const cols=this.cols.split(',');const out=mine.map(r=>Object.fromEntries(cols.map(c=>[c,r[c]])));return {data:this.single?(out[0]||null):out,error:null}}
   if(this.op==='update'){for(const r of mine)Object.assign(r,this.obj);return {data:null,error:null}}
   if(this.op==='delete'){for(const r of mine)rows.splice(rows.indexOf(r),1);return {data:null,error:null}}
   if(this.op==='upsert'){const o=this.obj;if(o.user_id!==cur.id)return {data:null,error:{message:'RLS: new row violates policy'}};
    const ex=rows.find(r=>r.user_id===o.user_id&&r.world_id===o.world_id);if(ex){Object.assign(ex,structuredClone(o));return {data:null,error:null}}
    if(uniq(o))return {data:null,error:{message:'duplicate key (unique constraint)'}};rows.push({id:'row'+seq++,...structuredClone(o)});return {data:null,error:null}}}}
 return {rows,st,login:id=>{cur.id=id},logout:()=>{cur.id=null},auth:{getUser:async()=>({data:{user:cur.id?{id:cur.id,email:cur.id+'@x'}:null}}),signInWithPassword:async()=>({error:null}),signUp:async()=>({error:null}),signOut:async()=>({})},from:()=>new Q(),
  // a Stage-4 cloud row (no world_id yet)
  addLegacyRow(uid,name,data){rows.push({id:'row'+seq++,user_id:uid,name,seed:String(data.seed),mode:data.mode,gen_version:data.gen_version,save_format:2,data,last_played:new Date().toISOString()})}}}
