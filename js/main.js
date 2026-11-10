import * as THREE from 'three';
import {World,B,INFO,solid,isWater} from './world.js';
import {stepPlayer,stepSpectator} from './physics.js';
import {newInv,canAdd,addItem,isBlockItem,isTool,toolSpeed,dropOf,wearTool,MODES,canMine,needMsg,furnaceTick,newFurnace} from './items.js';
import {setAtlas,slotHTML} from './icons.js';
import {createInvUI} from './invui.js';
import {putRecord,loadWorld,listWorlds,createWorld,renameWorld,duplicateWorld,deleteWorld,syncWorlds,markCloud,cloudPut,migrateLegacy,importGuest,getRecord,isSynced,GUEST,cleanName} from './worlds.js';
import {createMenu} from './menu.js';
import {initCloud,sb,signIn,signUp,signOut,user} from './cloud.js';
import {GEN_VERSION,SAVE_FORMAT} from './config.js';
const $=id=>document.getElementById(id);
const renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bc9e8);scene.fog=new THREE.Fog(0x9bc9e8,75,180);
scene.add(new THREE.HemisphereLight(0xd9efff,0x59613c,1.15));
const sun=new THREE.DirectionalLight(0xfff2d8,1.15);sun.position.set(-40,80,30);scene.add(sun);
const cam=new THREE.PerspectiveCamera(75,1,.1,300);
const resize=()=>{renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',resize);resize();
const sel=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.006,1.006,1.006)),new THREE.LineBasicMaterial({color:0x101010}));sel.visible=false;scene.add(sel);
const crackTex=(()=>{let r=4242;const rnd=()=>(r=(r*16807)%2147483647)/2147483647;const segs=[];
 for(let n=0;n<14;n++){let x=2+rnd()*12,y=2+rnd()*12;const pts=[[x,y]];for(let k=0;k<4;k++){x+=(rnd()-.5)*8;y+=(rnd()-.5)*8;pts.push([x,y])}segs.push(pts)}
 return Array.from({length:10},(_,s)=>{const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');
  g.fillStyle=`rgba(0,0,0,${.05+s*.04})`;g.fillRect(0,0,16,16);const n=Math.min(segs.length,Math.ceil((s+1)*1.4));
  for(let i=0;i<n;i++){const p=segs[i];for(const [col,o] of [['rgba(255,255,255,.4)',1],['rgba(0,0,0,.95)',0]]){g.strokeStyle=col;g.lineWidth=1;g.beginPath();p.forEach(([a,b],j)=>j?g.lineTo(a+o,b+o):g.moveTo(a+o,b+o));g.stroke()}}
  const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;return t})})();
const crack=new THREE.Mesh(new THREE.BoxGeometry(1.008,1.008,1.008),new THREE.MeshBasicMaterial({map:crackTex[0],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));crack.visible=false;crack.renderOrder=3;scene.add(crack);
let world,mode='survival',name='world',playing=false,slot=0,fly=false,dirty=false,wid,status='-',mine=null,holding=false,uwOn=false,denyKey='',xray=true,readOnly=false;const caps=()=>MODES[mode]||MODES.survival;
const P={x:8,y:50,z:8,vx:0,vy:0,vz:0,yaw:0,pitch:0,ground:false};
const IS={inv:newInv(),craft:Array(9).fill(null),held:null};let uiOpen=false;const CREATIVE_START=[B.GRASS,B.DIRT,B.STONE,B.PLANKS,B.LOG,B.COBBLE,B.GLASS,B.BRICK,B.WORKBENCH];
const mineTime={[B.GRASS]:.55,[B.DIRT]:.5,[B.SAND]:.45,[B.SNOW]:.3,[B.LEAVES]:.25,[B.GLASS]:.25,[B.PLANKS]:1.0,[B.LOG]:1.3,[B.BRICK]:2.0,[B.STONE]:2.0,[B.WORKBENCH]:1.2,[B.COAL_ORE]:2.6,[B.IRON_ORE]:3.0,[B.GOLD_ORE]:3.2,[B.DIAMOND_ORE]:3.6,[B.FURNACE]:2.2,[B.COBBLE]:2.3,[B.BEDROCK]:Infinity};
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code.startsWith('Digit')&&e.code!=='Digit0'&&caps().inventory){slot=+e.code.slice(5)-1;finishMine();ui()}if(e.code==='KeyF'&&mode==='creative')fly=!fly});
addEventListener('keyup',e=>keys[e.code]=false);
function ui(){const h=$('hotbar');h.style.display=caps().inventory?'':'none';h.innerHTML='';for(let i=0;i<9;i++){const d=document.createElement('div');d.className='slot'+(i===slot?' sel':'');d.innerHTML=slotHTML(IS.inv[i],mode==='creative');h.appendChild(d)}}
function setXray(on){xray=on;world.setXray(on);const c=on?0x0b1420:0x9bc9e8;scene.background.set(c);scene.fog.color.set(c);toast(on?'X-ray ON':'X-ray OFF')}
function specInit(){xray=true;$('specHelp').style.display=mode==='spectator'?'block':'none';if(mode==='spectator'){world.setXray(true);scene.background.set(0x0b1420);scene.fog.color.set(0x0b1420)}ui()}
addEventListener('keydown',e=>{if(e.code==='KeyX'&&playing&&mode==='spectator')setXray(!xray)});
function toast(m){let t=$('toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.opacity=0,1800)}
let AC=null,muted=false;
function sfx(k){if(muted)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=k==='break'?'square':'triangle';o.frequency.setValueAtTime(k==='break'?150:210+Math.random()*60,t);o.frequency.exponentialRampToValueAtTime(60,t+.12);g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.15)}catch(e){}}
addEventListener('keydown',e=>{if(e.code==='KeyM'&&playing){muted=!muted;toast(muted?'Sound off':'Sound on')}});
function breakBlock(x,y,z,b){sfx('break');const d=dropOf(b),k=x+','+y+','+z,fr=b===B.FURNACE?world.furnaces.get(k):null;
 if(mode==='survival'){const items=[{id:d,n:1},...(fr?fr.s.filter(Boolean):[])],t=IS.inv.map(s=>s&&{...s});
  if(items.some(it=>addItem(t,it.id,it.n,false,it.d)>0)){toast('Inventory full - make room first');finishMine();return}      // nothing is ever lost: refuse to break instead
  world.set(x,y,z,0);items.forEach(it=>addItem(IS.inv,it.id,it.n,false,it.d));if(wearTool(IS.inv,slot,false))toast('Your tool broke!')}
 else world.set(x,y,z,0);
 world.furnaces.delete(k);dirty=true;ui();finishMine()}
const invUI=createInvUI(IS,{mode:()=>mode,change(){dirty=true;ui()},furnace:k=>{let f=world.furnaces.get(k);if(!f){f=newFurnace();world.furnaces.set(k,f)}return f},onOpen(){uiOpen=true;holding=false;finishMine();for(const k in keys)keys[k]=false;document.exitPointerLock()},onClose(){uiOpen=false;ui();if(playing)$('c').requestPointerLock()}});
addEventListener('keydown',e=>{if(!playing)return;if(e.code==='KeyE'&&caps().inventory){e.preventDefault();invUI.isOpen()?invUI.close():invUI.open('inv')}else if(e.code==='Escape'&&invUI.isOpen())invUI.close()});
$('c').addEventListener('click',()=>{if(playing&&!uiOpen&&!document.pointerLockElement)$('c').requestPointerLock()});
const hits=(x,y,z)=>{for(let i=Math.floor(x-.3);i<=Math.floor(x+.3);i++)for(let j=Math.floor(y);j<=Math.floor(y+1.79);j++)for(let k=Math.floor(z-.3);k<=Math.floor(z+.3);k++)if(solid(world.get(i,j,k)))return true;return false};
function ray(){const dir=new THREE.Vector3();cam.getWorldDirection(dir);let prev=null;for(let t=0;t<6;t+=.04){const x=Math.floor(cam.position.x+dir.x*t),y=Math.floor(cam.position.y+dir.y*t),z=Math.floor(cam.position.z+dir.z*t);if(solid(world.get(x,y,z)))return {hit:[x,y,z],prev};if(!prev||prev[0]!==x||prev[1]!==y||prev[2]!==z)prev=[x,y,z]}return null}
function beginMine(){if(!playing||!document.pointerLockElement||!caps().mine)return;const r=ray();if(!r)return;const b=world.get(...r.hit);if(b===B.BEDROCK)return;if(mode==='survival'&&!canMine(b,IS.inv[slot]&&IS.inv[slot].id)){const k=r.hit.join(',');if(denyKey!==k){denyKey=k;toast(needMsg(b))}return}mine={pos:r.hit.join(','),hit:r.hit,elapsed:0,required:mode==='creative'?.12:(mineTime[b]||.7)/toolSpeed(IS.inv[slot]&&IS.inv[slot].id,b),block:b}}
function finishMine(){mine=null;crack.visible=false;$('mineUI').style.display='none'}
function showMine(p){$('mineUI').style.display='block';$('mineName').textContent=INFO[mine.block][0];$('mineFill').style.width=(p*100).toFixed(0)+'%'}
function camInWater(){return isWater(world.get(Math.floor(cam.position.x),Math.floor(cam.position.y),Math.floor(cam.position.z)))}
function setUnder(on){const el=$('uw');el.classList.toggle('on',on);el.classList.add('pulse');setTimeout(()=>el.classList.remove('pulse'),220);const c=on?0x2f86c8:0x9bc9e8;scene.fog.color.set(c);scene.fog.near=on?1:75;scene.fog.far=on?70:180;scene.background.set(c)}
addEventListener('mousedown',e=>{if(e.button===0&&!uiOpen&&caps().mine){holding=true;beginMine()}if(e.button===2&&playing&&!uiOpen&&caps().interact&&document.pointerLockElement){const r=ray();if(!r)return;{const hb=world.get(r.hit[0],r.hit[1],r.hit[2]);if(hb===B.WORKBENCH){invUI.open('bench');return}if(hb===B.FURNACE){invUI.open('furnace',r.hit.join(','));return}}if(!r.prev)return;const [x,y,z]=r.prev,sl=IS.inv[slot];if(!sl||!isBlockItem(sl.id))return;world.set(x,y,z,sl.id);if(hits(P.x,P.y,P.z)){world.set(x,y,z,0);return}if(mode==='survival'&&--sl.n<=0)IS.inv[slot]=null;dirty=true;ui()}});
addEventListener('mouseup',e=>{if(e.button===0){holding=false;denyKey='';finishMine()}});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(document.pointerLockElement){P.yaw-=e.movementX*.0022;P.pitch=Math.max(-1.55,Math.min(1.55,P.pitch-e.movementY*.0022))}});
// ================= world management: many independent worlds, each with its own id and its own save =================
let curRec=null,curOwner=GUEST,playSecs=0,saveChain=Promise.resolve();
const ownerNow=async()=>{try{const u=sb&&await user();return u?u.id:GUEST}catch(e){return GUEST}};
async function cloudPush(rec){if(!sb||rec.owner===GUEST)return false;try{const u=await user();if(!u||u.id!==rec.owner)return false;await cloudPut(sb,u.id,rec);await markCloud(rec.owner,rec.id,rec.lastPlayed);return true}catch(e){return false}}
async function doPersist(){if(readOnly||!curRec||!world)return;const rec=curRec;      // Spectator sessions never write anything
 const snap=JSON.parse(JSON.stringify({...rec,seed:world.seed,gen_version:world.genVersion,pos:[P.x,P.y,P.z],rot:[P.yaw,P.pitch],mods:[...world.mods],slots:IS.inv,craft:IS.craft,held:IS.held,furnaces:Object.fromEntries(world.furnaces),health:20,hunger:20,playtime:playSecs,lastPlayed:Date.now(),format:SAVE_FORMAT}));
 try{await putRecord(snap);rec.lastPlayed=snap.lastPlayed;rec.pos=snap.pos}catch(e){status='SAVE FAILED';return}
 if(await cloudPush(snap)){dirty=false;status='saved + cloud'}else{dirty=!!(sb&&rec.owner!==GUEST);status=rec.owner===GUEST?'saved (this device)':'saved locally - cloud will retry'}}
const persist=()=>saveChain=saveChain.then(doPersist,doPersist);     // saves run one at a time, so a delete can never be overtaken by a late save
setInterval(()=>{if(playing&&dirty)persist()},15000);addEventListener('pagehide',()=>{if(playing)persist()});
function unloadWorld(){if(world)for(const c of world.chunks.values()){c.meshes.forEach(m=>scene.remove(m));(c.xm||[]).forEach(m=>scene.remove(m))}world=null;finishMine()}
async function enterWorld(rec,spectate){
 if(curRec&&world&&!readOnly)await persist();                                     // 1. save the world we are leaving (inventory, position, edits ...)
 unloadWorld();const R=JSON.parse(JSON.stringify(rec));curRec=R;                  // 2. load the chosen world from its own record only
 mode=spectate?'spectator':(R.mode==='spectator'?'creative':R.mode);readOnly=!!spectate;
 IS.inv=R.slots;IS.craft=R.craft||Array(9).fill(null);IS.held=R.held||null;
 world=new World(R.seed,scene,R.gen_version||1);world.mods=new Map(R.mods||[]);world.furnaces=new Map(Object.entries(R.furnaces||{}));
 Object.assign(P,{vx:0,vy:0,vz:0,ground:false,blocked:false,leap:0,yaw:0,pitch:0});
 if(R.pos){[P.x,P.y,P.z]=R.pos;[P.yaw,P.pitch]=R.rot||[0,0]}else{P.x=8.5;P.z=8.5;P.y=70}
 slot=0;fly=false;holding=false;mine=null;denyKey='';playSecs=R.playtime||0;uiOpen=false;
 for(let i=0;i<40;i++)world.update(P.x,P.z,5);
 if(!R.pos){let sx=8,sz=8;out:for(let r=0;r<40;r+=2)for(let a=0;a<8;a++){const x=Math.floor(8+Math.cos(a*.785)*r),z=Math.floor(8+Math.sin(a*.785)*r),t=world.surface(x,z),b=world.get(x,t-1,z);if(!isWater(b)&&b!==B.LEAVES){sx=x;sz=z;break out}}P.x=sx+.5;P.z=sz+.5;P.y=world.surface(sx,sz)+(mode==='spectator'?8:.1)}
 uwOn=false;setUnder(false);setAtlas(world.atlas.image);specInit();
 if(mode==='creative'&&IS.inv.slice(0,9).every(x=>!x))CREATIVE_START.forEach((id,i)=>IS.inv[i]={id,n:64});
 $('menu').style.display='none';playing=true;ui();$('c').requestPointerLock();
 if(!R.pos&&!readOnly)persist();return R}
const DIG=globalThis.DIG={
 currentId:()=>curRec?curRec.id:null,canResume:()=>!!(curRec&&world),
 async list(){curOwner=await ownerNow();if(sb&&curOwner!==GUEST){try{const m=await syncWorlds(sb,curOwner);
   for(const x of m)if(!x.remote&&!isSynced(x)){const r=await getRecord(x.owner,x.id);if(r)await cloudPush(r)}   // upload anything the cloud is missing
   return m}catch(e){}}return listWorlds(curOwner)},
 async guestCount(){return curOwner!==GUEST?(await listWorlds(GUEST)).length:0},
 async importLocal(){const n=await importGuest(curOwner);return n},
 async createWorld(o){curOwner=await ownerNow();const rec=await createWorld(curOwner,o);await cloudPush(rec);return enterWorld(rec,false)},
 async play(meta,{spectate=false}={}){const rec=await loadWorld(sb,meta.owner,meta.id);if(!rec)throw new Error('World not found');return enterWorld(rec,spectate)},
 async rename(meta,name){if(curRec&&curRec.id===meta.id)curRec.name=cleanName(name);const r=await renameWorld(meta.owner,meta.id,name);await cloudPush(r);return r},
 async duplicate(meta){if(curRec&&world&&!readOnly&&curRec.id===meta.id)await persist();const d=await duplicateWorld(meta.owner,meta.id);await cloudPush(d);return d},
 async remove(meta){if(curRec&&curRec.id===meta.id&&curRec.owner===meta.owner){playing=false;holding=false;finishMine();curRec=null;unloadWorld();if(document.pointerLockElement)document.exitPointerLock()}   // deleting the loaded world: stop it first
   await saveChain;return deleteWorld(sb,meta.owner,meta.id)},
 resume(){if(!(curRec&&world))return;$('menu').style.display='none';playing=true;$('c').requestPointerLock()},
 persist};
const menu=createMenu(DIG);
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&playing&&!uiOpen){playing=false;holding=false;finishMine();persist();menu.showMain(true);$('menu').style.display='flex'}});
await initCloud();$('auth').style.display=sb?'flex':'none';try{await migrateLegacy()}catch(e){console.warn('legacy migration failed (existing saves are untouched)',e)}
async function onAuth(){curOwner=await ownerNow();if(curRec&&curRec.owner!==curOwner){if(world&&!readOnly)await persist();playing=false;unloadWorld();curRec=null}menu.showMain(!!curRec)}   // never carry one account's world into another account
if(sb){$('login').onclick=async()=>{const r=await signIn($('email').value,$('pw').value);$('who').textContent=r.error?r.error.message:'Logged in';if(!r.error)await onAuth()};$('signup').onclick=async()=>{const r=await signUp($('email').value,$('pw').value);$('who').textContent=r.error?r.error.message:'Check your email to confirm'};$('logout').onclick=async()=>{await signOut();$('who').textContent='Logged out';await onAuth()};const u=await user();if(u)$('who').textContent=u.email}
let last=performance.now(),fps=60;
(function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000)||.016;last=t;fps=fps*.9+.1/dt;if(playing)playSecs+=dt;if(world){world.wtex.offset.set((t*.00004)%1,(t*.00011)%1);world.wmat.opacity=.8+Math.sin(t*.0014)*.03}
 if(world&&playing){if(mode!=='spectator')for(const f of world.furnaces.values())if(furnaceTick(f,dt))dirty=true;invUI.tick(dt);if(world.xray)world.xmat.glow.opacity=.2+Math.sin(t*.004)*.08}
 if(playing){world.update(P.x,P.z,6);const st=uiOpen?{swim:false}:mode==='spectator'?stepSpectator(P,{fx:(keys.KeyD?1:0)-(keys.KeyA?1:0),fz:(keys.KeyS?1:0)-(keys.KeyW?1:0),up:!!keys.Space,down:!!(keys.ShiftLeft||keys.ShiftRight),yaw:P.yaw},dt):stepPlayer(P,world,{fx:(keys.KeyD?1:0)-(keys.KeyA?1:0),fz:(keys.KeyS?1:0)-(keys.KeyW?1:0),space:!!keys.Space,sprint:!!keys.ShiftLeft,down:!!(keys.ControlLeft||keys.ControlRight),fly,yaw:P.yaw},dt),inW=st.swim;
  cam.position.set(P.x,P.y+1.62,P.z);cam.rotation.set(P.pitch,P.yaw,0,'YXZ');{const cw=mode!=='spectator'&&camInWater();if(cw!==uwOn){uwOn=cw;setUnder(cw)}}const r=ray();sel.visible=!!r;if(r)sel.position.set(r.hit[0]+.5,r.hit[1]+.5,r.hit[2]+.5);
  if(mine){const current=ray(),same=current&&current.hit.join(',')===mine.pos;if(!same||world.get(...mine.hit)!==mine.block)finishMine();else{mine.elapsed+=dt;mine.snd=(mine.snd||0)+dt;if(mine.snd>.22){mine.snd=0;sfx('hit')}const progress=Math.min(1,mine.elapsed/mine.required);crack.visible=true;crack.position.set(mine.hit[0]+.5,mine.hit[1]+.5,mine.hit[2]+.5);crack.material.map=crackTex[Math.min(9,Math.floor(progress*10))];showMine(progress);if(progress>=1){const [x,y,z]=mine.hit,b=mine.block;breakBlock(x,y,z,b)}}}
  if(!mine&&holding)beginMine();if(mode!=='spectator')world.stepWater(10);
  $('hud').textContent=`DIG BUILD · ${curRec?curRec.name+' · ':''}${mode==='spectator'?'SPECTATOR · X-RAY '+(xray?'ON':'OFF'):mode} · seed ${world.seed} · ${P.x|0},${P.y|0},${P.z|0} · ${fps|0}fps · save: ${status}${uwOn?' · UNDERWATER':inW?' · SWIMMING':''}`}
 renderer.render(scene,cam)})(last);
