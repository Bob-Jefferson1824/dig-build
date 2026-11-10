import {SAVE_FORMAT,GEN_VERSION} from './config.js';
import {migrate} from './save.js';
// ===== World management: every world has its own unique id, its own record, and belongs to one owner (an account id, or GUEST when logged out). =====
export const GUEST='local';
export const rk=(o,id)=>o+'|'+id;                                   // storage key: owner + world id (two accounts on one device never collide)
export const seedNum=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))|0;return h||1};   // same text -> same terrain as every earlier version
export const hash36=s=>{let a=5381,b=52711;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=(((a<<5)+a)^c)|0;b=((b<<5)+b+c*31)|0}return (a>>>0).toString(36)+(b>>>0).toString(36)};
export const legacyId=key=>'w_legacy_'+hash36(key);                   // Stage-4 worlds get a deterministic id, so migrating twice never duplicates them
export const newId=()=>'w_'+(globalThis.crypto&&crypto.randomUUID?crypto.randomUUID().replace(/-/g,''):Date.now().toString(36)+Math.random().toString(36).slice(2,12));
export const randomSeed=()=>String(Math.floor(Math.random()*1e9));
export const cleanName=n=>String(n==null?'':n).replace(/\s+/g,' ').trim().slice(0,40)||'New World';
export const cleanMode=m=>m==='creative'?'creative':'survival';
// ---------- IndexedDB (db "digbuild" v2: store "worlds" = full records, store "index" = small metadata for the world list). Old v1 data is kept as-is. ----------
let dbp=null;export const _resetDB=()=>{dbp=null};
const rq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const openDB=()=>dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open('digbuild',2);r.onupgradeneeded=()=>{const d=r.result;for(const n of ['worlds','index'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
async function txn(names,mode,fn){const db=await openDB(),t=db.transaction(names,mode),done=new Promise((res,rej)=>{t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)});const out=await fn(...names.map(n=>t.objectStore(n)));await done;return out}   // one transaction = a save is all-or-nothing
export const metaOf=r=>({id:r.id,owner:r.owner,name:r.name,seedText:r.seedText,seed:r.seed,mode:r.mode,gen_version:r.gen_version||1,created:r.created,lastPlayed:r.lastPlayed,playtime:r.playtime||0,legacyKey:r.legacyKey||null,pos:r.pos?[...r.pos]:null,cloudAt:0});
export async function putRecord(rec){const k=rk(rec.owner,rec.id),m=metaOf(rec);await txn(['worlds','index'],'readwrite',async(w,i)=>{const old=await rq(i.get(k));if(old&&!old.del)m.cloudAt=old.cloudAt||0;w.put(rec,k);i.put(m,k)});return m}
export const getMeta=(owner,id)=>txn(['index'],'readonly',i=>rq(i.get(rk(owner,id))));
export async function getRecord(owner,id){const r=await txn(['worlds'],'readonly',w=>rq(w.get(rk(owner,id))));return r?migrate(r):null}
export async function listWorlds(owner){const all=await txn(['index'],'readonly',i=>rq(i.getAll()));return all.filter(m=>m&&!m.del&&m.owner===owner).sort((a,b)=>b.lastPlayed-a.lastPlayed)}
export async function markCloud(owner,id,at){await txn(['index'],'readwrite',async i=>{const k=rk(owner,id),m=await rq(i.get(k));if(m&&!m.del){m.cloudAt=at;i.put(m,k)}})}
export async function deleteRecord(owner,id){const m=await getMeta(owner,id);await txn(['worlds','index'],'readwrite',(w,i)=>{w.delete(rk(owner,id));i.delete(rk(owner,id));if(m&&m.legacyKey)w.delete(m.legacyKey)})}   // only this world (+ its own Stage-4 raw copy)
export async function createWorld(owner,{name,seedText,mode}={}){const st=String(seedText==null||String(seedText).trim()===''?randomSeed():seedText).trim(),now=Date.now();
 const rec={format:SAVE_FORMAT,id:newId(),owner,name:cleanName(name),seedText:st,seed:seedNum(st),mode:cleanMode(mode),gen_version:GEN_VERSION,created:now,lastPlayed:now,playtime:0,pos:null,rot:[0,0],mods:[],slots:Array(36).fill(null),craft:Array(9).fill(null),held:null,furnaces:{},health:20,hunger:20};await putRecord(rec);return rec}
export async function renameWorld(owner,id,name){const r=await getRecord(owner,id);if(!r)throw new Error('World not found');r.name=cleanName(name);await putRecord(r);return r}   // only the name changes
export async function duplicateWorld(owner,id,name){const r=await getRecord(owner,id);if(!r)throw new Error('World not found');const c=JSON.parse(JSON.stringify(r)),now=Date.now();
 Object.assign(c,{id:newId(),name:cleanName(name||r.name+' (copy)'),created:now,lastPlayed:now,legacyKey:null,cloudAt:0});await putRecord(c);return c}
// Stage-4 saves (keys like "world-<seed>") become proper worlds. The old raw record is left in place as a backup; running this again changes nothing.
export async function migrateLegacy(){const keys=await txn(['worlds'],'readonly',w=>rq(w.getAllKeys()));let n=0;
 for(const key of keys){if(typeof key!=='string'||!key.startsWith('world-'))continue;const id=legacyId(key);if(await getMeta(GUEST,id))continue;
  const raw=await txn(['worlds'],'readonly',w=>rq(w.get(key)));if(!raw)continue;const d=migrate(JSON.parse(JSON.stringify(raw))),seedText=key.slice(6),now=Date.now();
  await putRecord({...d,id,owner:GUEST,name:d.name||key,seedText,seed:Number.isFinite(d.seed)?d.seed:seedNum(seedText),mode:d.mode||'survival',gen_version:d.gen_version||1,created:now,lastPlayed:now,playtime:d.playtime||0,legacyKey:key,rot:d.rot||[0,0],furnaces:d.furnaces||{},mods:d.mods||[]});n++}return n}
export async function importGuest(uid){const g=await listWorlds(GUEST);let n=0;for(const m of g){if(await getMeta(uid,m.id))continue;const r=await getRecord(GUEST,m.id);if(!r)continue;const c=JSON.parse(JSON.stringify(r));c.owner=uid;c.legacyKey=null;await putRecord(c);n++}return n}
const tombs=async owner=>(await txn(['index'],'readonly',i=>rq(i.getAll()))).filter(m=>m&&m.del&&m.owner===owner);
// ---------- Supabase (rows: one per world, unique per (user_id, world_id); RLS keeps every user inside their own rows) ----------
const iso=t=>new Date(t).toISOString();
export async function cloudMigrate(sb){const {data,error}=await sb.from('worlds').select('id,name,world_id');if(error)throw error;let n=0;
 for(const r of data||[])if(!r.world_id){const {error:e}=await sb.from('worlds').update({world_id:legacyId(r.name),display_name:r.name}).eq('id',r.id);if(e)throw e;n++}return n}
const COLS='name,world_id,display_name,seed,mode,gen_version,last_played,playtime_s';
function cloudMeta(r,uid){const legacy=String(r.name||'').startsWith('world-')&&r.display_name===r.name;return {id:r.world_id,owner:uid,name:r.display_name||r.name,seedText:legacy?r.name.slice(6):String(r.seed),seed:seedNum(legacy?r.name.slice(6):String(r.seed)),mode:r.mode,gen_version:r.gen_version||1,created:Date.parse(r.last_played),lastPlayed:Date.parse(r.last_played),playtime:r.playtime_s||0,remote:true,cloudAt:Date.parse(r.last_played)}}
export async function cloudList(sb,uid){const {data,error}=await sb.from('worlds').select(COLS);if(error)throw error;return (data||[]).filter(r=>r.world_id).map(r=>cloudMeta(r,uid))}
export async function cloudGet(sb,id){const {data,error}=await sb.from('worlds').select(COLS+',data').eq('world_id',id).maybeSingle();if(error)throw error;return data}
export function recFromCloud(row,uid){const d=migrate(JSON.parse(JSON.stringify(row.data||{}))),m=cloudMeta(row,uid);
 return {...d,id:row.world_id,owner:uid,name:d.name&&d.id?d.name:m.name,seedText:d.seedText||m.seedText,seed:Number.isFinite(d.seed)?d.seed:m.seed,mode:d.mode||m.mode,gen_version:d.gen_version||m.gen_version,created:d.created||m.created,lastPlayed:d.lastPlayed||m.lastPlayed,playtime:d.playtime||m.playtime,mods:d.mods||[],rot:d.rot||[0,0],furnaces:d.furnaces||{},legacyKey:null}}
export async function cloudPut(sb,uid,rec){const {error}=await sb.from('worlds').upsert({user_id:uid,name:rec.id,world_id:rec.id,display_name:rec.name,seed:rec.seedText,mode:rec.mode,gen_version:rec.gen_version,save_format:rec.format,playtime_s:Math.round(rec.playtime||0),data:rec,last_played:iso(rec.lastPlayed)},{onConflict:'user_id,world_id'});if(error)throw error}
export async function cloudDelete(sb,uid,id){const {error}=await sb.from('worlds').delete().eq('user_id',uid).eq('world_id',id);if(error)throw error}
export async function deleteWorld(sb,owner,id){await deleteRecord(owner,id);if(owner===GUEST||!sb)return true;
 try{await cloudDelete(sb,owner,id);return true}catch(e){await txn(['index'],'readwrite',i=>{i.put({del:true,owner,id},'del|'+rk(owner,id))});return false}}   // cloud unreachable: remember to delete later, never resurrect
async function retryTombs(sb,uid){for(const t of await tombs(uid)){try{await cloudDelete(sb,uid,t.id);await txn(['index'],'readwrite',i=>{i.delete('del|'+rk(uid,t.id))})}catch(e){}}}
export const isSynced=m=>!!m.cloudAt&&m.cloudAt>=m.lastPlayed-1500;
export async function syncWorlds(sb,uid){await retryTombs(sb,uid);try{await cloudMigrate(sb)}catch(e){}
 const cloud=await cloudList(sb,uid),dead=new Set((await tombs(uid)).map(t=>t.id)),local=await listWorlds(uid),by=new Map(local.map(m=>[m.id,m])),out=[...local];
 for(const c of cloud){if(dead.has(c.id))continue;const l=by.get(c.id);if(!l)out.push(c);else if(c.lastPlayed>l.lastPlayed+1500)l.cloudNewer=true;else l.cloudAt=Math.max(l.cloudAt||0,c.lastPlayed)}
 return out.sort((a,b)=>b.lastPlayed-a.lastPlayed)}
export async function loadWorld(sb,owner,id){let rec=await getRecord(owner,id);
 if(owner!==GUEST&&sb){try{const row=await cloudGet(sb,id);if(row){const cl=row.data&&row.data.lastPlayed?row.data.lastPlayed:Date.parse(row.last_played);if(!rec||cl>rec.lastPlayed+1500){rec=recFromCloud(row,owner);await putRecord(rec)}}}catch(e){}}
 return rec}
