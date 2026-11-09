import * as THREE from 'three';
import {World,B,INFO,solid,isWater} from './world.js';
import {stepPlayer,stepSpectator} from './physics.js';
import {newInv,canAdd,addItem,isBlockItem,isTool,toolSpeed,dropOf,wearTool,MODES,canMine,needMsg,furnaceTick,newFurnace} from './items.js';
import {setAtlas,slotHTML} from './icons.js';
import {createInvUI} from './invui.js';
import {localSave,localLoad,pack,migrate} from './save.js';
import {initCloud,sb,signIn,signUp,signOut,user,cloudSave,cloudLoad} from './cloud.js';
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
const seedNum=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))|0;return h||1};
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
async function persist(){if(readOnly)return;const data=pack(world,[P.x,P.y,P.z],{seed:world.seed,mode,name,gen_version:world.genVersion,slots:IS.inv,craft:IS.craft,held:IS.held,furnaces:Object.fromEntries(world.furnaces),health:20,hunger:20});await localSave(wid,data);try{if(sb&&await user())await cloudSave({name,seed:String(world.seed),mode,gen_version:world.genVersion,save_format:SAVE_FORMAT,data});dirty=false;status='saved'}catch(e){status='offline: local backup kept, retrying'}}
setInterval(()=>{if(playing&&dirty)persist()},15000);
async function start(){const seed=$('seed').value||'dig';mode=$('mode').value;const wantSpec=mode==='spectator';name='world-'+seed;wid=name;IS.inv=newInv();IS.craft=Array(9).fill(null);IS.held=null;if(world)for(const c of world.chunks.values()){c.meshes.forEach(m=>scene.remove(m));(c.xm||[]).forEach(m=>scene.remove(m))};let s=await localLoad(wid);try{if(sb&&await user()){const r=await cloudLoad(name);if(r)s=migrate(r.data)}}catch(e){}
 world=new World(seedNum(seed),scene,s?(s.gen_version||1):GEN_VERSION);if(s){world.mods=new Map(s.mods);IS.inv=s.slots;IS.craft=s.craft||Array(9).fill(null);IS.held=s.held||null;world.furnaces=new Map(Object.entries(s.furnaces||{}));mode=(s.mode&&s.mode!=='spectator')?s.mode:mode;[P.x,P.y,P.z]=s.pos}else{P.x=8.5;P.z=8.5;P.y=70}
 readOnly=false;if(wantSpec&&s&&s.mode!=='spectator'){mode='spectator';readOnly=true}   // viewing someone's survival/creative world: nothing is ever written back
 for(let i=0;i<40;i++)world.update(P.x,P.z,5);if(!s){let sx=8,sz=8;out:for(let r=0;r<40;r+=2)for(let a=0;a<8;a++){const x=Math.floor(8+Math.cos(a*.785)*r),z=Math.floor(8+Math.sin(a*.785)*r),t=world.surface(x,z),b=world.get(x,t-1,z);if(!isWater(b)&&b!==B.LEAVES){sx=x;sz=z;break out}}P.x=sx+.5;P.z=sz+.5;P.y=world.surface(sx,sz)+(mode==='spectator'?8:.1)}uwOn=false;setUnder(false);setAtlas(world.atlas.image);specInit();if(mode==='creative'&&IS.inv.slice(0,9).every(x=>!x))CREATIVE_START.forEach((id,i)=>IS.inv[i]={id,n:64});uiOpen=false;$('menu').style.display='none';playing=true;ui();$('c').requestPointerLock();if(!s&&mode==='spectator')persist()}
$('play').onclick=start;
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&playing&&!uiOpen){playing=false;holding=false;finishMine();persist();$('menu').style.display='flex'}});
await initCloud();$('auth').style.display=sb?'flex':'none';
if(sb){$('login').onclick=async()=>{const r=await signIn($('email').value,$('pw').value);$('who').textContent=r.error?r.error.message:'Logged in'};$('signup').onclick=async()=>{const r=await signUp($('email').value,$('pw').value);$('who').textContent=r.error?r.error.message:'Check your email to confirm'};$('logout').onclick=async()=>{await signOut();$('who').textContent='Logged out'};const u=await user();if(u)$('who').textContent=u.email}
let last=performance.now(),fps=60;
(function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000)||.016;last=t;fps=fps*.9+.1/dt;if(world){world.wtex.offset.set((t*.00004)%1,(t*.00011)%1);world.wmat.opacity=.8+Math.sin(t*.0014)*.03}
 if(world&&playing){if(mode!=='spectator')for(const f of world.furnaces.values())if(furnaceTick(f,dt))dirty=true;invUI.tick(dt);if(world.xray)world.xmat.glow.opacity=.2+Math.sin(t*.004)*.08}
 if(playing){world.update(P.x,P.z,6);const st=uiOpen?{swim:false}:mode==='spectator'?stepSpectator(P,{fx:(keys.KeyD?1:0)-(keys.KeyA?1:0),fz:(keys.KeyS?1:0)-(keys.KeyW?1:0),up:!!keys.Space,down:!!(keys.ShiftLeft||keys.ShiftRight),yaw:P.yaw},dt):stepPlayer(P,world,{fx:(keys.KeyD?1:0)-(keys.KeyA?1:0),fz:(keys.KeyS?1:0)-(keys.KeyW?1:0),space:!!keys.Space,sprint:!!keys.ShiftLeft,down:!!(keys.ControlLeft||keys.ControlRight),fly,yaw:P.yaw},dt),inW=st.swim;
  cam.position.set(P.x,P.y+1.62,P.z);cam.rotation.set(P.pitch,P.yaw,0,'YXZ');{const cw=mode!=='spectator'&&camInWater();if(cw!==uwOn){uwOn=cw;setUnder(cw)}}const r=ray();sel.visible=!!r;if(r)sel.position.set(r.hit[0]+.5,r.hit[1]+.5,r.hit[2]+.5);
  if(mine){const current=ray(),same=current&&current.hit.join(',')===mine.pos;if(!same||world.get(...mine.hit)!==mine.block)finishMine();else{mine.elapsed+=dt;mine.snd=(mine.snd||0)+dt;if(mine.snd>.22){mine.snd=0;sfx('hit')}const progress=Math.min(1,mine.elapsed/mine.required);crack.visible=true;crack.position.set(mine.hit[0]+.5,mine.hit[1]+.5,mine.hit[2]+.5);crack.material.map=crackTex[Math.min(9,Math.floor(progress*10))];showMine(progress);if(progress>=1){const [x,y,z]=mine.hit,b=mine.block;breakBlock(x,y,z,b)}}}
  if(!mine&&holding)beginMine();if(mode!=='spectator')world.stepWater(10);
  $('hud').textContent=`DIG BUILD · ${mode==='spectator'?'SPECTATOR · X-RAY '+(xray?'ON':'OFF'):mode} · seed ${world.seed} · ${P.x|0},${P.y|0},${P.z|0} · ${fps|0}fps · save: ${status}${uwOn?' · UNDERWATER':inW?' · SWIMMING':''}`}
 renderer.render(scene,cam)})(last);
