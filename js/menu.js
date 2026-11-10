import {drawPreview} from './world.js';
import {isSynced,GUEST} from './worlds.js';
// ===== Menu screens: Main Menu, World Select, Create New World, Rename, Delete confirmation =====
const Q=id=>document.getElementById(id);
export const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fmtPlay=s=>{s=Math.floor(s||0);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}h ${String(m).padStart(2,'0')}m`:m?`${m}m`:`${s}s`};
export const ago=(t,now=Date.now())=>{const s=Math.max(0,(now-t)/1000);if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';return Math.floor(s/86400)+' d ago'};
export const EMPTY_HTML='<div class="empty">You haven\'t created any worlds yet.<br>Press <b>CREATE NEW WORLD</b> to begin.</div>';
export function cardHTML(m,now=Date.now()){const sync=m.owner===GUEST?'saved on this device':isSynced(m)?'&#9729; synced to your account':m.cloudNewer?'&#9729; newer copy in the cloud':'&#9729; waiting to sync',pos=m.pos||[0,0,0];
 return `<div class="wcard" data-id="${esc(m.id)}"><canvas class="thumb" data-seed="${esc(m.seed)}" data-gen="${esc(m.gen_version||1)}" data-x="${Math.floor(pos[0])}" data-z="${Math.floor(pos[2])}"></canvas>`+
 `<div class="winfo"><div class="wname">${esc(m.name)}</div><div class="wmeta"><span class="badge ${m.mode==='creative'?'cr':'sv'}">${m.mode==='creative'?'CREATIVE':'SURVIVAL'}</span> Seed: <code>${esc(m.seedText)}</code></div>`+
 `<div class="wmeta">Last played: ${esc(new Date(m.lastPlayed).toLocaleString())} &middot; Playtime: ${fmtPlay(m.playtime)}</div><div class="wmeta saved">Last saved ${ago(m.lastPlayed,now)} &middot; ${sync}</div>`+
 `<div class="wbtns"><button data-act="play">PLAY</button><button data-act="spectate" title="Fly through the world with ore X-ray. View only - nothing is changed.">SPECTATE</button><button data-act="rename">RENAME</button><button data-act="dup">DUPLICATE</button><button data-act="del" class="danger">DELETE</button></div></div></div>`}
export function createMenu(api){
 const scr=n=>{for(const id of ['scrMain','scrWorlds','scrCreate'])Q(id).hidden=id!==n};let metas=[],mode='survival',target=null;
 const showMain=(canResume)=>{scr('scrMain');Q('btnResume').hidden=!canResume;closeDlg()};
 function closeDlg(){Q('dlgRename').hidden=true;Q('dlgDelete').hidden=true}
 async function showWorlds(){scr('scrWorlds');closeDlg();Q('worldList').innerHTML='<div class="empty">Loading worlds&hellip;</div>';try{metas=await api.list()}catch(e){metas=[]}render();try{Q('btnImport').hidden=!(await api.guestCount())}catch(e){}}
 function render(){Q('worldList').innerHTML=metas.length?metas.map(m=>cardHTML(m)).join(''):EMPTY_HTML;
  for(const cv of Q('worldList').querySelectorAll('canvas.thumb'))drawPreview(cv,+cv.dataset.seed,+cv.dataset.gen,+cv.dataset.x,+cv.dataset.z)}
 function setMode(m){mode=m;Q('modeSv').classList.toggle('on',m==='survival');Q('modeCr').classList.toggle('on',m==='creative');preview()}
 function preview(){const st=Q('newSeed').value.trim()||'(random)',nm=Q('newName').value.trim()||'New World';Q('newSummary').textContent=`${nm} \u2014 ${mode==='creative'?'Creative':'Survival'} \u2014 seed ${st}`;
  const cv=Q('newThumb');if(Q('newSeed').value.trim()){const t=Q('newSeed').value.trim();let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))|0;drawPreview(cv,h||1,3,0,0,48,4)}}
 const rand=()=>{Q('newSeed').value=String(Math.floor(Math.random()*1e9));preview()};
 function showCreate(){scr('scrCreate');Q('newName').value='New World';setMode('survival');rand()}
 Q('btnPlay').onclick=showWorlds;Q('btnResume').onclick=()=>api.resume();Q('btnCreateMain').onclick=showCreate;Q('btnCreate').onclick=showCreate;Q('btnBackWorlds').onclick=()=>showMain(api.canResume());
 Q('btnImport').onclick=async()=>{await api.importLocal();showWorlds()};Q('modeSv').onclick=()=>setMode('survival');Q('modeCr').onclick=()=>setMode('creative');Q('btnRandom').onclick=rand;
 Q('newSeed').oninput=preview;Q('newName').oninput=preview;Q('btnBackCreate').onclick=showWorlds;
 Q('btnCreateWorld').onclick=async()=>{Q('btnCreateWorld').disabled=true;try{await api.createWorld({name:Q('newName').value,seedText:Q('newSeed').value,mode})}finally{Q('btnCreateWorld').disabled=false}};
 Q('btnRenameCancel').onclick=closeDlg;Q('btnRenameOk').onclick=async()=>{if(!target)return;const t=target;closeDlg();await api.rename(t,Q('renameInput').value);showWorlds()};
 Q('btnDelCancel').onclick=closeDlg;Q('btnDelOk').onclick=async()=>{if(!target)return;const t=target;closeDlg();await api.remove(t);showWorlds()};
 Q('worldList').onclick=async e=>{const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const card=b.closest('.wcard'),m=metas.find(x=>x.id===card.dataset.id);if(!m)return;target=m;
  if(b.dataset.act==='play')await api.play(m);else if(b.dataset.act==='spectate')await api.play(m,{spectate:true});
  else if(b.dataset.act==='rename'){Q('renameInput').value=m.name;Q('dlgRename').hidden=false}
  else if(b.dataset.act==='dup'){const d=await api.duplicate(m);await showWorlds();target=metas.find(x=>x.id===d.id)||null;if(target){Q('renameInput').value=d.name;Q('dlgRename').hidden=false}}   // the copy opens in the rename box so its name is editable
  else if(b.dataset.act==='del'){Q('delText').textContent=`Are you sure you want to permanently delete "${m.name}"?`;Q('delNote').textContent=m.id===api.currentId()?'This is the world you are currently playing. You will return to World Select.':'This cannot be undone. Your other worlds are not affected.';Q('dlgDelete').hidden=false}};
 return {showMain,showWorlds,showCreate}}
