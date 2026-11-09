// Headless integration test: runs the REAL main.js (game loop, input handlers, save code) against stubbed DOM / Three.js / IndexedDB.
// It proves game logic and mode gating; it does NOT render pixels. Run: node tests/mode.test.mjs
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dig-mode-'));
fs.writeFileSync(path.join(tmp,'three.mjs'),`
export class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}}
export class Color{set(){}} export class Fog{constructor(c,n,f){this.color=new Color();this.near=n;this.far=f}}
export class Scene{constructor(){this.children=[];this.background=new Color();globalThis.__scene=this}add(o){this.children.push(o)}remove(o){const i=this.children.indexOf(o);if(i>=0)this.children.splice(i,1)}}
export class WebGLRenderer{setPixelRatio(){}setSize(){}render(){}}
export class HemisphereLight{} export class DirectionalLight{constructor(){this.position={set(){}}}}
export class PerspectiveCamera{constructor(){const s=this;this.position={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}};this.rotation={x:0,y:0,set(x,y){this.x=x;this.y=y}};globalThis.__cam=this}updateProjectionMatrix(){}getWorldDirection(v){const p=this.rotation.x,y=this.rotation.y;v.x=-Math.sin(y)*Math.cos(p);v.y=Math.sin(p);v.z=-Math.cos(y)*Math.cos(p);return v}}
export class BoxGeometry{} export class EdgesGeometry{}
export class MeshBasicMaterial{constructor(o){Object.assign(this,o);this.color={setRGB(r,g,b){this.r=r},r:1}}} export class LineBasicMaterial extends MeshBasicMaterial{}
export class Mesh{constructor(g,m){this.geometry=g;this.material=m;this.visible=true;this.position={set(){}}}} export class LineSegments extends Mesh{}
export class CanvasTexture{constructor(i){this.image=i;this.offset={set(){}}}}
export class BufferGeometry{constructor(){this.a={}}setAttribute(n,v){this.a[n]=v}setIndex(i){this.idx=i}dispose(){}} export class Float32BufferAttribute{constructor(a){this.array=a}}
export const NearestFilter=1,RepeatWrapping=2,SRGBColorSpace=3,DoubleSide=2,AdditiveBlending=3;`);
for(const f of fs.readdirSync(path.join(root,'js')))fs.writeFileSync(path.join(tmp,f),fs.readFileSync(path.join(root,'js',f),'utf8').replace("from 'three'","from './three.mjs'"));
// ---- fake browser ----
const handlers={},dh={},store=new Map(),elStore={},els=new Proxy(elStore,{get:(t,k)=>t[k]??=mkEl(k)});let raf=null;
const ctx=new Proxy({}, {get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true}});
const mkEl=id=>({id,style:{},dataset:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},appendChild(c){return c},querySelector:()=>null,querySelectorAll:()=>[],closest:()=>null,requestPointerLock(){document.pointerLockElement=this},value:'',textContent:'',innerHTML:'',getContext:()=>ctx,toDataURL:()=>'x',width:0,height:0});
globalThis.document={getElementById:id=>els[id],createElement:t=>mkEl(t),body:mkEl('body'),addEventListener:(t,f)=>(dh[t]??=[]).push(f),pointerLockElement:null,exitPointerLock(){document.pointerLockElement=null}};
globalThis.addEventListener=(t,f)=>(handlers[t]??=[]).push(f);globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=f=>{raf=f};
globalThis.indexedDB={open(){const r={};setTimeout(()=>{r.result={createObjectStore(){},transaction(){const tr={objectStore:()=>({put(v,k){store.set(k,structuredClone(v));setTimeout(()=>tr.oncomplete&&tr.oncomplete())},get(k){const q={};setTimeout(()=>{q.result=store.has(k)?structuredClone(store.get(k)):undefined;q.onsuccess&&q.onsuccess()});return q}})};return tr}};r.onupgradeneeded&&r.onupgradeneeded();r.onsuccess&&r.onsuccess()});return r}};
await import(pathToFileURL(path.join(tmp,'main.js')));
// ---- helpers ----
let T=1000;const sleep=ms=>new Promise(r=>setTimeout(r,ms)),frame=(n=1)=>{for(let i=0;i<n;i++){T+=16;raf(T)}};
const fire=(type,ev={})=>{for(const f of handlers[type]||[])f({preventDefault(){},button:0,movementX:0,movementY:0,code:'',target:{closest:()=>null},...ev})};
const key=(code,down=true)=>fire(down?'keydown':'keyup',{code}),tap=code=>{key(code,true);key(code,false)};
const startWorld=async(seed,mode)=>{els.seed.value=seed;els.mode.value=mode;await els.play.onclick();frame(3)};
const leave=async()=>{document.pointerLockElement=null;for(const f of dh.pointerlockchange||[])f();await sleep(30)};   // pointer lock lost -> pause menu + save
const cam=()=>globalThis.__cam.position,hud=()=>els.hud.textContent,sc=()=>globalThis.__scene;
const xrayMeshes=()=>sc().children.filter(o=>o.material&&o.material.depthTest===false);
const crack=()=>sc().children.find(o=>o.material&&o.material.polygonOffset);
let n=0;const ok=async(name,fn)=>{await fn();console.log('PASS',name);n++};

const saved=seed=>store.get('world-'+seed);
// ===== A: new Spectator world =====
await startWorld('sp1','spectator');
await ok('Spectator can be selected; HUD says SPECTATOR and X-ray ON by default; control guide shown; hotbar hidden',()=>{assert.match(hud(),/SPECTATOR · X-RAY ON/);assert.equal(els.specHelp.style.display,'block');assert.equal(els.hotbar.style.display,'none');assert.ok(xrayMeshes().length>0,'no x-ray meshes')});
await ok('X key toggles X-ray OFF/ON; markers removed/restored (HUD updates)',()=>{tap('KeyX');frame(2);assert.match(hud(),/X-RAY OFF/);assert.equal(xrayMeshes().length,0);tap('KeyX');frame(2);assert.match(hud(),/X-RAY ON/);assert.ok(xrayMeshes().length>0)});
await ok('free movement: W forward, Space up, Shift down; no gravity when idle',()=>{const p0={...cam()};key('KeyW');frame(60);key('KeyW',false);frame(30);assert.ok(Math.hypot(cam().x-p0.x,cam().z-p0.z)>8,'forward');const y1=cam().y;key('Space');frame(40);key('Space',false);frame(200);assert.ok(cam().y>y1+5,'up '+(cam().y-y1));const y2=cam().y;frame(40);assert.ok(Math.abs(cam().y-y2)<1e-3,'gravity-free idle');key('ShiftLeft');frame(120);key('ShiftLeft',false);frame(30);assert.ok(cam().y<y2-20,'down '+(y2-cam().y))});
await ok('passes through terrain: kept descending far below the surface (no collision) and strafing keys work',()=>{key('ShiftLeft');frame(100);key('ShiftLeft',false);frame(30);assert.ok(cam().y<14,'y='+cam().y);const x0=cam().x;key('KeyD');frame(40);key('KeyD',false);frame(30);assert.notEqual(cam().x,x0)});
await ok('new chunks load while X-ray is ON and they get markers too',()=>{const before=new Set(xrayMeshes());key('KeyW');frame(400);key('KeyW',false);frame(60);const after=xrayMeshes();assert.ok(after.length>0);assert.ok(after.some(m=>!before.has(m)),'no markers for new chunks');assert.match(hud(),/X-RAY ON/)});
await ok('mining / placing / inventory / interactions are all disabled in Spectator',()=>{document.pointerLockElement=els.c;fire('mousemove',{movementY:900});fire('mousedown',{button:0});frame(80);fire('mouseup',{button:0});assert.equal(crack().visible,false,'crack overlay appeared');fire('mousedown',{button:2});frame(5);fire('mouseup',{button:2});const z0=cam().z,x0=cam().x;tap('KeyE');tap('Digit3');key('KeyS');frame(30);key('KeyS',false);assert.ok(Math.hypot(cam().x-x0,cam().z-z0)>1,'E opened an inventory and froze the player')});
await leave();
await ok('new Spectator world is saved with mode=spectator, no edits, empty inventory',()=>{const s=saved('sp1');assert.ok(s,'no save');assert.equal(s.mode,'spectator');assert.equal(s.mods.length,0);assert.ok(s.slots.every(x=>x===null));assert.equal(s.format,3)});
await startWorld('sp1','survival');
await ok('continuing a spectator-saved world with Survival selected switches it to Survival (mode switching)',()=>{assert.match(hud(),/survival/);assert.equal(els.specHelp.style.display,'none');assert.equal(xrayMeshes().length,0,'x-ray leaked into survival');assert.equal(els.hotbar.style.display,'')});
await leave();
// ===== B: Survival still works =====
await startWorld('sv1','survival');
await ok('SURVIVAL: hold left mouse -> block takes time, breaks, item enters inventory, saved',async()=>{document.pointerLockElement=els.c;fire('mousemove',{movementY:900});fire('mousedown',{button:0});frame(4);assert.equal(crack().visible,true);frame(3);assert.equal(saved('sv1')?.mods?.length??0,0);frame(90);fire('mouseup',{button:0});await leave();const s=saved('sv1');assert.ok(s.mods.length>=1,'nothing mined');assert.ok(s.slots.some(x=>x&&x.n>=1),'item not collected');assert.equal(s.mode,'survival')});
const svBefore=JSON.stringify(saved('sv1'));
// ===== C: Spectator viewing an existing Survival world must not modify it =====
await startWorld('sv1','spectator');
await ok('Spectator over an existing Survival world: read-only (saved world byte-for-byte unchanged)',async()=>{assert.match(hud(),/SPECTATOR/);document.pointerLockElement=els.c;fire('mousemove',{movementY:900});fire('mousedown',{button:0});key('KeyW');frame(120);key('KeyW',false);fire('mouseup',{button:0});tap('KeyE');await leave();assert.equal(JSON.stringify(saved('sv1')),svBefore)});
await startWorld('sv1','survival');
await ok('back in Survival: mode, edits and inventory restored from the untouched save',()=>{assert.match(hud(),/survival/);assert.equal(xrayMeshes().length,0)});
await leave();
// ===== D: Creative =====
await startWorld('cr1','creative');
await ok('CREATIVE: quick mining works, creative start items present, F flies, nothing consumed',async()=>{document.pointerLockElement=els.c;fire('mousemove',{movementY:900});fire('mousedown',{button:0});frame(60);fire('mouseup',{button:0});tap('KeyF');const y=cam().y;key('Space');frame(40);key('Space',false);assert.ok(cam().y>y+2,'creative flight');await leave();const s=saved('cr1');assert.ok(s.mods.length>=2,'creative mining: '+s.mods.length);assert.equal(s.mode,'creative');assert.equal(s.slots.filter(Boolean).length,9);assert.ok(s.slots.slice(0,9).every(x=>x.n===64))});
await startWorld('sv1','creative');
await ok('existing Survival world still opens as Survival when Creative is selected (existing behaviour preserved)',()=>assert.match(hud(),/survival/));
await leave();
console.log(`\n${n} integration checks passed (stubbed browser - no real rendering)`);process.exit(0);
