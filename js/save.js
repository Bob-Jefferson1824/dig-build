import {SAVE_FORMAT} from './config.js';
const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('digbuild',1);r.onupgradeneeded=()=>r.result.createObjectStore('worlds');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
export async function localSave(id,data){const db=await open();return new Promise((res,rej)=>{const t=db.transaction('worlds','readwrite');t.objectStore('worlds').put(data,id);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
export async function localLoad(id){const db=await open();return new Promise((res,rej)=>{const r=db.transaction('worlds').objectStore('worlds').get(id);r.onsuccess=()=>res(r.result?migrate(r.result):null);r.onerror=()=>rej(r.error)})}
// Versioned save migrations: add a step per format bump, never drop old steps.
// format 1 -> 2: inventory became 36 slots ({id,n,d}); the old {blockId:count} object is converted into stacks. Nothing is ever deleted.
function legacySlots(inv){const a=Array(36).fill(null);let k=0;for(const [id,n] of Object.entries(inv||{})){let r=+n||0;while(r>0&&k<36){const m=Math.min(64,r);a[k++]={id:+id,n:m};r-=m}}return a}
export function migrate(s){s.format=s.format||1;if(s.format<2){if(!Array.isArray(s.slots))s.slots=legacySlots(s.inv);s.craft=s.craft||Array(9).fill(null);s.held=s.held||null;s.format=2}
 if(s.format<3){s.furnaces=s.furnaces||{};s.format=3}
 if(!Array.isArray(s.slots)||s.slots.length!==36){const a=Array(36).fill(null);(s.slots||[]).slice(0,36).forEach((x,i)=>a[i]=x);s.slots=a}return s}
export const pack=(w,p,extra)=>({format:SAVE_FORMAT,...extra,pos:p,mods:[...w.mods]});
