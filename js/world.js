import * as THREE from 'three';
export const B={AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,SNOW:5,LOG:6,LEAVES:7,WATER:8,PLANKS:9,BEDROCK:10,COBBLE:11,GLASS:12,BRICK:13,FLOWING_WATER:14,WORKBENCH:15,COAL_ORE:16,IRON_ORE:17,GOLD_ORE:18,DIAMOND_ORE:19,FURNACE:20,CACTUS:21,AUTUMN_LEAVES:22,MUSHROOM_CAP:23,MUSHROOM_STEM:24,REEDS:25};
export const isWater=id=>id===B.WATER||id===B.FLOWING_WATER;
export const INFO={1:['Grass',[84,150,58]],2:['Dirt',[120,84,52]],3:['Stone',[125,125,128]],4:['Sand',[218,205,150]],5:['Snow',[240,244,250]],6:['Log',[98,72,40]],7:['Leaves',[48,120,40]],8:['Water',[60,160,240]],9:['Planks',[170,132,80]],10:['Bedrock',[45,45,48]],11:['Cobble',[100,100,104]],12:['Glass',[190,225,235]],13:['Bricks',[150,70,58]],14:['Water',[60,160,240]],15:['Workbench',[150,105,58]],16:['Coal Ore',[40,40,44]],17:['Iron Ore',[222,176,146]],18:['Gold Ore',[252,214,60]],19:['Diamond Ore',[96,236,236]],20:['Furnace',[112,112,116]],21:['Cactus',[55,145,65]],22:['Autumn Leaves',[205,105,35]],23:['Mushroom Cap',[175,45,55]],24:['Mushroom Stem',[225,215,185]],25:['Reeds',[105,150,65]]};
const NT=26,S=16,H=192,SEA=22;
const NEW_SEA=35,NEW_SURFACE_BASE=78;
export const solid=id=>id!==0&&!isWater(id);
const see=id=>id===0||isWater(id)||id===7||id===12||id===B.AUTUMN_LEAVES;
export function makeAtlas(){const c=document.createElement('canvas');c.width=NT*16;c.height=16;const g=c.getContext('2d');let r=12345;const rnd=()=>(r=(r*16807)%2147483647)/2147483647;
 for(let i=1;i<NT;i++){const col=INFO[i][1];for(let y=0;y<16;y++)for(let x=0;x<16;x++){const v=.8+rnd()*.4;g.fillStyle=`rgb(${col.map(k=>Math.min(255,k*v|0))})`;g.fillRect(i*16+x,y,1,1);}}
 {const o=15*16;g.fillStyle='rgb(150,105,58)';g.fillRect(o,0,16,16);g.fillStyle='rgb(108,72,36)';for(let k=0;k<16;k+=5)g.fillRect(o,k,16,1);g.fillRect(o,0,1,16);g.fillRect(o+15,0,1,16);g.fillStyle='rgb(70,70,78)';g.fillRect(o+3,3,7,3);g.fillStyle='rgb(205,60,50)';g.fillRect(o+10,9,3,4);g.fillStyle='rgb(225,225,230)';g.fillRect(o+3,10,5,1)}
 for(const [id,col] of [[16,[28,28,32]],[17,[222,176,146]],[18,[252,214,60]],[19,[96,236,236]]]){const o=id*16;for(let y=0;y<16;y++)for(let x=0;x<16;x++){const v=.82+rnd()*.34;g.fillStyle=`rgb(${[125,125,128].map(k=>k*v|0)})`;g.fillRect(o+x,y,1,1)}
  for(let n=0;n<7;n++){const bx=1+rnd()*12|0,by=1+rnd()*12|0;for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]){const v=.85+rnd()*.3;g.fillStyle=`rgb(${col.map(k=>Math.min(255,k*v|0))})`;g.fillRect(o+bx+dx,by+dy,1,1)}g.fillStyle='rgba(255,255,255,.35)';g.fillRect(o+bx,by,1,1)}}
 {const o=20*16;for(let y=0;y<16;y++)for(let x=0;x<16;x++){const v=.8+rnd()*.3;g.fillStyle=`rgb(${[112,112,116].map(k=>k*v|0)})`;g.fillRect(o+x,y,1,1)}g.fillStyle='#2a2a2e';g.fillRect(o+3,6,10,7);g.fillStyle='#ff9a2e';g.fillRect(o+5,9,6,3);g.fillStyle='#ffd45a';g.fillRect(o+6,10,4,1);g.fillStyle='#3d3d42';g.fillRect(o+2,2,12,2)}
 // Stage 9 biome vegetation textures.
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const n=hash(x,y,941);
  const cactus=n>.72? [35,105,45]:[65,155,72];
  g.fillStyle=`rgb(${cactus})`;g.fillRect(21*16+x,y,1,1);
  g.fillStyle=(x%5===0||y%5===0)?'rgb(150,65,22)':'rgb(205,112,38)';g.fillRect(22*16+x,y,1,1);
  const cap=(y<6&&((x-7)**2+(y-6)**2<46))||((x<5||x>10)&&y>4&&y<11);
  g.fillStyle=cap?'rgb(180,48,58)':(x%4===0?'rgb(245,235,205)':'rgb(225,215,185)');g.fillRect(23*16+x,y,1,1);
  g.fillStyle=(x%4===0||y%5===0)?'rgb(195,185,155)':'rgb(235,225,195)';g.fillRect(24*16+x,y,1,1);
  g.fillStyle=(x%4===0)?'rgb(70,110,45)':'rgb(125,165,75)';g.fillRect(25*16+x,y,1,1);
 }
 const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return t}
// Water has its own 2-tile texture (source | flowing) that wraps vertically so it can scroll for a subtle wave effect.
export function makeWaterTex(){const c=document.createElement('canvas');c.width=16;c.height=16;const g=c.getContext('2d'),TP=Math.PI*2;
 const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t|0);
 // One tile for ALL water (source + flowing). Every term repeats exactly across 16px so it tiles and scrolls seamlessly.
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const a=Math.sin(TP*(x/16+y/8))*.5+.5,b=Math.sin(TP*(x/8-y/16))*.5+.5,w=Math.pow(a*b,1.4);
  g.fillStyle=`rgb(${mix([48,142,236],[132,210,255],Math.min(1,w*1.6))})`;g.fillRect(x,y,1,1)}
 g.fillStyle='rgba(215,242,255,.8)';for(const [x,y] of [[3,2],[11,6],[6,11],[14,13],[1,8]])g.fillRect(x,y,1,1);
 const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t}
const XC={16:{core:[.16,.16,.18],edge:[.78,.8,.88]},17:{core:[.82,.4,.12],edge:[1,.62,.28],glow:[.9,.4,.08]},18:{core:[1,.84,.12],edge:[1,.96,.55],glow:[.95,.75,.05]},19:{core:[.15,.95,1],edge:[.85,1,1],glow:[.05,.8,1]}};
function cube(a,x,y,z,h,col,lines){const b=a.p.length/3;for(const [dx,dy,dz] of [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]){a.p.push(x+dx*h,y+dy*h,z+dz*h);a.c.push(col[0],col[1],col[2])}
 a.i.push(...(lines?[0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]:[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,2,3,7,2,7,6,0,4,7,0,7,3,1,2,6,1,6,5]).map(v=>v+b))}
const N4=[[1,0],[-1,0],[0,1],[0,-1]],TUBE=.0016,CAV=.76,PT=.68,POOLY=10;
function hash3(x,y,z,s){let h=(x*374761393+y*668265263+z*2147483629+s*982451653)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295}
// lattice value noise (trilinear) cached for one chunk (+1 block border). f(wx,y,wz) is identical no matter which chunk builds it.
function field(seed,sp,spy,cx,cz){const x0=Math.floor((cx*S-1)/sp),z0=Math.floor((cz*S-1)/sp),nx=Math.floor((cx*S+S)/sp)-x0+2,nz=Math.floor((cz*S+S)/sp)-z0+2,ny=Math.floor(H/spy)+2,o=nx*ny,v=new Float32Array(nx*nz*ny);
 for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)v[(k*ny+j)*nx+i]=hash3(x0+i,j,z0+k,seed);
 return (wx,y,wz)=>{const fx=wx/sp-x0,fy=y/spy,fz=wz/sp-z0,i=fx|0,j=fy|0,k=fz|0,tx=sm(fx-i),ty=sm(fy-j),tz=sm(fz-k),b=(k*ny+j)*nx+i;
  const l=(p,q,t)=>p+(q-p)*t,c00=l(v[b],v[b+1],tx),c10=l(v[b+nx],v[b+nx+1],tx),c01=l(v[b+o],v[b+o+1],tx),c11=l(v[b+o+nx],v[b+o+nx+1],tx);return l(l(c00,c10,ty),l(c01,c11,ty),tz)}}
// Legacy single-block ore scatter remains available to worlds generated before Stage 9.
const LEGACY_ORES=[[B.DIAMOND_ORE,13,.0007,11],[B.GOLD_ORE,24,.0022,22],[B.IRON_ORE,46,.0045,33],[B.COAL_ORE,56,.0065,44]],NB=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
function oreAtLegacy(x,y,z,seed){for(const [id,ymax,p,salt] of LEGACY_ORES){if(y>ymax)continue;const s=seed+salt*7919;if(hash3(x,y,z,s)<p)return id;for(const [dx,dy,dz] of NB)if(hash3(x+dx,y+dy,z+dz,s)<p&&hash3(x,y,z,s+500)<.45)return id}return 0}
// Stage 9 deposits are curved, connected veins. Each deterministic seed cell creates a short, angled, gently bent seam.
const VEINS=[[B.DIAMOND_ORE,42,.06,311],[B.GOLD_ORE,70,.12,733],[B.IRON_ORE,115,.24,1193],[B.COAL_ORE,145,.34,1877]];
function segmentDistanceSq(px,py,pz,ax,ay,az,bx,by,bz){const vx=bx-ax,vy=by-ay,vz=bz-az,wx=px-ax,wy=py-ay,wz=pz-az,den=vx*vx+vy*vy+vz*vz,t=den?Math.max(0,Math.min(1,(wx*vx+wy*vy+wz*vz)/den)):0,dx=px-(ax+vx*t),dy=py-(ay+vy*t),dz=pz-(az+vz*t);return dx*dx+dy*dy+dz*dz}
function oreAt(x,y,z,seed){const cell=12,gx=Math.floor(x/cell),gy=Math.floor(y/cell),gz=Math.floor(z/cell);
 for(const [id,ymax,chance,salt] of VEINS){if(y>ymax)continue;const s=seed+salt;
  for(let dz=-1;dz<=1;dz++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const cx=gx+dx,cy=gy+dy,cz=gz+dz;if(hash3(cx,cy,cz,s)>=chance)continue;
   const h=(n)=>hash3(cx,cy,cz,s+n),ax=cx*cell+1+h(1)*10,ay=cy*cell+1+h(2)*10,az=cz*cell+1+h(3)*10;
   let vx=h(4)*2-1,vy=(h(5)*2-1)*.72,vz=h(6)*2-1;const mag=Math.hypot(vx,vy,vz)||1;vx/=mag;vy/=mag;vz/=mag;
   const len=5+h(7)*5,bx=ax+vx*len,by=ay+vy*len,bz=az+vz*len,mx=(ax+bx)/2+(h(8)-.5)*3,my=(ay+by)/2+(h(9)-.5)*2,mz=(az+bz)/2+(h(10)-.5)*3,r=1.05+h(11)*.48,r2=r*r;
   if(segmentDistanceSq(x,y,z,ax,ay,az,mx,my,mz)<=r2||segmentDistanceSq(x,y,z,mx,my,mz,bx,by,bz)<=r2)return id;
  }
 }return 0}
// A deterministic graph of gently bent tunnel segments. Horizontal links make a connected network; occasional vertical links join cave levels.
function caveNode(ix,iy,iz,seed){const h=n=>hash3(ix,iy,iz,seed+n);return {x:ix*44+8+h(1)*28,y:12+iy*28+(h(2)-.5)*8,z:iz*44+8+h(3)*28}}
function tunnelAt(x,y,z,seed){const ix=Math.floor(x/44),iy=Math.floor((y-12)/28),iz=Math.floor(z/44);
 for(let dz=-1;dz<=1;dz++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=caveNode(ix+dx,iy+dy,iz+dz,seed),rx=x-a.x,ry=y-a.y,rz=z-a.z,room=4.1+hash3(ix+dx,iy+dy,iz+dz,seed+80)*1.7;if(rx*rx+ry*ry+rz*rz<room*room)return true;
  for(const [ex,ey,ez,kind] of [[1,0,0,1],[0,0,1,2],[0,1,0,3]]){const nx=ix+dx+ex,ny=iy+dy+ey,nz=iz+dz+ez;if(kind===3&&hash3(ix+dx,iy+dy,iz+dz,seed+90)>.34)continue;const b=caveNode(nx,ny,nz,seed),h=n=>hash3(ix+dx,iy+dy,iz+dz,seed+n+kind*101),mx=(a.x+b.x)/2+(h(4)-.5)*7,my=(a.y+b.y)/2+(h(5)-.5)*4,mz=(a.z+b.z)/2+(h(6)-.5)*7,r=2.15+h(7)*.9,r2=r*r;
   if(segmentDistanceSq(x,y,z,a.x,a.y,a.z,mx,my,mz)<r2||segmentDistanceSq(x,y,z,mx,my,mz,b.x,b.y,b.z)<r2)return true;
  }
 }return false}
function hash(x,z,s){let h=(x*374761393+z*668265263+s*982451653)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295}
const sm=t=>t*t*(3-2*t);
function vnoise(x,z,s){const xi=Math.floor(x),zi=Math.floor(z),fx=sm(x-xi),fz=sm(z-zi);const a=hash(xi,zi,s),b=hash(xi+1,zi,s),c=hash(xi,zi+1,s),d=hash(xi+1,zi+1,s);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz}
function fbm(x,z,s){return vnoise(x,z,s)*.55+vnoise(x*2,z*2,s+1)*.28+vnoise(x*4,z*4,s+2)*.17}
const F=[[[1,0,0],[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],.8],[[-1,0,0],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],.8],[[0,1,0],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],1],[[0,-1,0],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],.5],[[0,0,1],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],.7],[[0,0,-1],[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],.7]];
// Broad, deterministic climate fields create large biome regions with natural-looking boundaries.
export const BIOME={FOREST:'Forest',DESERT:'Desert',JUNGLE:'Jungle',SNOWY_MOUNTAINS:'Snowy Mountains',SWAMP:'Swamp',PLAINS:'Plains',AUTUMN_FOREST:'Autumn Forest',TAIGA:'Taiga',BEACH:'Beach and Coast',MUSHROOM_FIELDS:'Mushroom Fields'};
export function biomeAt(seed,wx,wz,gen=5){
 if(gen<5)return BIOME.FOREST;
 const temperature=fbm(wx/520,wz/520,seed+1701),moisture=fbm(wx/390,wz/390,seed+2701),rare=fbm(wx/700,wz/700,seed+3701);
 if(fbm(wx/420,wz/420,seed+91)>=.22&&fbm(wx/420,wz/420,seed+91)<.27)return BIOME.BEACH;
 if(rare>.86&&moisture>.58&&temperature>.38&&temperature<.72)return BIOME.MUSHROOM_FIELDS;
 if(temperature<.27)return BIOME.SNOWY_MOUNTAINS;
 if(temperature>.69&&moisture<.39)return BIOME.DESERT;
 if(moisture>.76&&temperature>.35&&temperature<.75)return BIOME.SWAMP;
 if(temperature>.62&&moisture>.59)return BIOME.JUNGLE;
 if(temperature<.43&&moisture>.43)return BIOME.TAIGA;
 if(temperature>.46&&temperature<.7&&moisture<.49)return BIOME.AUTUMN_FOREST;
 if(moisture<.43)return BIOME.PLAINS;
 return BIOME.FOREST;
}
export function heightAt(seed,wx,wz,gen=3){
 const m=Math.max(0,fbm(wx/220,wz/220,seed+7)-.5)*2;
 if(gen>=5){
  const continent=fbm(wx/420,wz/420,seed+91),climate=biomeAt(seed,wx,wz,gen);
  if(continent<.22)return 28+Math.floor(fbm(wx/75,wz/75,seed+123)*8);
  const broad=fbm(wx/70,wz/70,seed),detail=fbm(wx/24,wz/24,seed+611);
  let h=NEW_SURFACE_BASE+broad*22+m*m*30+(detail-.5)*5;
  if(climate===BIOME.BEACH)h=NEW_SEA-1+broad*4;
  if(climate===BIOME.DESERT)h=NEW_SURFACE_BASE-5+broad*12+(detail-.5)*3;
  if(climate===BIOME.PLAINS)h=NEW_SURFACE_BASE-7+broad*12+(detail-.5)*3;
  if(climate===BIOME.SWAMP)h=NEW_SEA-3+broad*5+(detail-.5)*2;
  if(climate===BIOME.JUNGLE)h=NEW_SURFACE_BASE+3+broad*23+m*m*18;
  if(climate===BIOME.SNOWY_MOUNTAINS)h=NEW_SURFACE_BASE+24+broad*38+m*m*45;
  if(climate===BIOME.TAIGA)h=NEW_SURFACE_BASE+3+broad*22+m*m*25;
  if(climate===BIOME.MUSHROOM_FIELDS)h=NEW_SURFACE_BASE+2+broad*17+(detail-.5)*4;
  return Math.max(NEW_SEA-5,Math.min(H-18,Math.floor(h)));
 }
 if(gen>=4){const continent=fbm(wx/420,wz/420,seed+91);if(continent<.22)return 28+Math.floor(fbm(wx/75,wz/75,seed+123)*8);return Math.min(H-18,Math.floor(NEW_SURFACE_BASE+fbm(wx/70,wz/70,seed)*26+m*m*36))}
 return Math.min(56,Math.floor(18+fbm(wx/70,wz/70,seed)*20+m*m*40))
}
// small top-down terrain thumbnail (colours by height) drawn straight from the seed: used on world cards and the create-world screen
export function drawPreview(cv,seed,gen,cx=0,cz=0,N=40,step=4){cv.width=cv.height=N;const g=cv.getContext('2d'),sea=gen>=4?NEW_SEA:gen>=2?25:22;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const h=heightAt(seed|0,Math.floor(cx+(i-N/2)*step),Math.floor(cz+(j-N/2)*step),gen);let c;
  if(h<=sea){const d=Math.min(1,(sea-h)/10);c=[40-d*20|0,110-d*40|0,200-d*50|0]}else if(h<=sea+1)c=[216,200,140];else if(h>(gen>=4?118:46))c=[240,244,250];else if(h>(gen>=4?105:38))c=[125,125,130];else{const s=.75+(h-sea)/60;c=[70*s|0,150*s|0,60*s|0]}
  g.fillStyle=`rgb(${c})`;g.fillRect(i,j,1,1)}g.fillStyle='#fff';g.fillRect(N/2-1,N/2-1,2,2)}
export class World{
 constructor(seed,scene,gen=1){this.genVersion=gen;this.sea=gen>=4?NEW_SEA:gen>=2?25:SEA;this.seed=seed|0;this.scene=scene;this.chunks=new Map();this.mods=new Map();this.furnaces=new Map();this.dirty=new Set();
  this.atlas=makeAtlas();this.fluidQueue=[];this.fluidSeen=new Set();this.flowDistance=new Map();this.mat=new THREE.MeshBasicMaterial({map:this.atlas,vertexColors:true,alphaTest:.1});
  this.wtex=makeWaterTex();this.wmat=new THREE.MeshBasicMaterial({map:this.wtex,vertexColors:true,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});this.xray=false;
  // X-ray overlay materials: drawn after everything else with depth testing OFF, so ores show through any number of blocks.
  this.xmat={core:new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.95,depthTest:false,depthWrite:false,fog:false,side:THREE.DoubleSide}),glow:new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.26,depthTest:false,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}),line:new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95,depthTest:false,depthWrite:false,fog:false})}}
 key(x,z){return x+','+z}
 clearX(c){if(c.xm){for(const m of c.xm)this.scene.remove(m),m.geometry.dispose();c.xm=null}}
 // X-ray markers are built only from the ore blocks that really exist in the chunk (c.ores comes straight from the voxel data). Nothing in the world data is touched.
 buildXray(c){this.clearX(c);if(!this.xray||!c.ores||!c.ores.length)return;const K={core:{p:[],c:[],i:[]},glow:{p:[],c:[],i:[]},line:{p:[],c:[],i:[]}};
  for(let n=0;n<c.ores.length;n+=4){const x=c.ores[n]+.5,y=c.ores[n+1]+.5,z=c.ores[n+2]+.5,xc=XC[c.ores[n+3]];cube(K.core,x,y,z,.3,xc.core,false);cube(K.line,x,y,z,.505,xc.edge,true);if(xc.glow)cube(K.glow,x,y,z,.62,xc.glow,false)}
  c.xm=[];for(const [k,mat,ord] of [['core',this.xmat.core,10],['glow',this.xmat.glow,11],['line',this.xmat.line,12]]){const a=K[k];if(!a.p.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(a.c,3));g.setIndex(a.i);const m=k==='line'?new THREE.LineSegments(g,mat):new THREE.Mesh(g,mat);m.renderOrder=ord;m.frustumCulled=false;this.scene.add(m);c.xm.push(m)}}
 // terrain turns dark + semi-transparent (material properties only; textures and voxel data are never changed), water keeps its own material.
 setXray(on){this.xray=on;const m=this.mat;m.transparent=on;m.opacity=on?.34:1;m.depthWrite=!on;m.color.setRGB(on?.32:1,on?.38:1,on?.46:1);m.needsUpdate=true;for(const c of this.chunks.values())this.buildXray(c)}
 height(wx,wz){return heightAt(this.seed,wx,wz,this.genVersion)}
 // ---- Stage 9: connected underground tunnel networks. Every tunnel is derived from world coordinates and seed, so adjacent chunks join perfectly. ----
 cavesCtx(cx,cz){const s=this.seed;if(this.genVersion>=4)return {seed:s};return {seed:s,A:field(s+1001,14,10,cx,cz),Bf:field(s+2002,16,8,cx,cz),C:field(s+3003,22,14,cx,cz),P:field(s+4004,18,H,cx,cz)}}
 carve(d,c,cx,cz,x,z,h){const wx=cx*S+x,wz=cz*S+z,I=y=>(y*S+z)*S+x;
  if(this.genVersion>=4){for(let y=10;y<=h-12;y++)if(tunnelAt(wx,y,wz,c.seed))d[I(y)]=0;
   for(let y=1,top=Math.min(h-4,145);y<=top;y++)if(d[I(y)]===B.STONE){const o=oreAt(wx,y,wz,this.seed);if(o)d[I(y)]=o}
   return}
  const sea=this.sea,at=(dx,dz)=>this.height(wx+dx,wz+dz);let lim=h>sea+4?h:h-4;for(const [dx,dz] of N4){const hn=at(dx,dz);if(hn<=sea)lim=Math.min(lim,hn-3)}
  const pm=c.P(wx,0,wz)>PT;
  for(let y=4;y<=lim;y++){const a=c.A(wx,y,wz)-.5,b=c.Bf(wx,y,wz)-.5,wide=c.C(wx,y,wz);if(a*a+b*b>=TUBE&&wide<=CAV)continue;if(y<=POOLY&&pm)d[I(y)]=B.WATER;else d[I(y)]=0}
  for(let y=1,top=Math.min(h-4,56);y<=top;y++)if(d[I(y)]===B.STONE){const o=oreAtLegacy(wx,y,wz,this.seed);if(o)d[I(y)]=o}}
 gen(cx,cz){const sea=this.sea,d=new Uint8Array(S*H*S);const I=(x,y,z)=>(y*S+z)*S+x;const g3=this.genVersion>=3?this.cavesCtx(cx,cz):null;
  for(let x=0;x<S;x++)for(let z=0;z<S;z++){const wx=cx*S+x,wz=cz*S+z;
   const h=this.height(wx,wz);
   const biome=this.genVersion>=5?biomeAt(this.seed,wx,wz,this.genVersion):BIOME.FOREST;
   const topY=h,coast=this.genVersion>=5&&h<=sea+3&&h>sea-2;
   for(let y=0;y<=h;y++){let b=B.STONE;if(y===0)b=B.BEDROCK;else if(y>h-4)b=B.DIRT;
    if(y===h){
     if(coast||biome===BIOME.DESERT)b=B.SAND;
     else if(biome===BIOME.SNOWY_MOUNTAINS||h>118)b=B.SNOW;
     else if(h>105)b=B.STONE;
     else b=B.GRASS;
    }
    if(this.genVersion>=5&&biome===BIOME.SWAMP&&y===h)b=B.DIRT;
    d[I(x,y,z)]=b}
   for(let y=h+1;y<=sea;y++)d[I(x,y,z)]=B.WATER;
   if(g3)this.carve(d,g3,cx,cz,x,z,h);
   if(this.genVersion>=5){
    const r=hash(wx,wz,this.seed+509),surface=h+1;
    if(biome===BIOME.DESERT&&h>sea+2&&r<.018){const tall=2+(hash(wx,wz,this.seed+510)*3|0);for(let t=0;t<tall;t++)d[I(x,h+1+t,z)]=B.CACTUS}
    else if(biome===BIOME.SWAMP&&h>sea-2&&r<.045){for(let t=0;t<2+(r*20|0);t++)d[I(x,h+1+t,z)]=B.REEDS}
    else if(biome===BIOME.MUSHROOM_FIELDS&&h>sea+1&&x>=2&&x<=13&&z>=2&&z<=13&&r<.026){const stem=2+(r*80|0)%3;for(let t=0;t<stem;t++)d[I(x,h+1+t,z)]=B.MUSHROOM_STEM;for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(dx*dx+dz*dz<=4)d[I(x+dx,h+stem,z+dz)]=B.MUSHROOM_CAP}
    else if(!coast&&h>sea+1&&h<155&&x>2&&x<13&&z>2&&z<13){
     const chance=biome===BIOME.JUNGLE?.085:biome===BIOME.FOREST?.035:biome===BIOME.AUTUMN_FOREST?.04:biome===BIOME.TAIGA?.055:biome===BIOME.SWAMP?.025:biome===BIOME.PLAINS?.006:.012;
     if(r<chance){
      const jungle=biome===BIOME.JUNGLE,taiga=biome===BIOME.TAIGA,autumn=biome===BIOME.AUTUMN_FOREST,swamp=biome===BIOME.SWAMP;
      const trunk=(jungle?8:taiga?7:autumn?5:swamp?4:4)+(hash(wx,wz,this.seed+511)*3|0);
      for(let t=1;t<=trunk;t++)d[I(x,h+t,z)]=B.LOG;
      const radius=jungle?3:taiga?1:2,leaf=jungle?B.LEAVES:autumn?B.AUTUMN_LEAVES:B.LEAVES;
      for(let dy=trunk-2;dy<=trunk+2;dy++){const rad=dy===trunk+2?1:radius;for(let dx=-rad;dx<=rad;dx++)for(let dz=-rad;dz<=rad;dz++)if(dx*dx+dz*dz<=rad*rad+1&&!d[I(x+dx,h+dy,z+dz)])d[I(x+dx,h+dy,z+dz)]=leaf}
      if(swamp)for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]])for(let t=0;t<2;t++)if(!d[I(x+dx,h+t,z+dz)])d[I(x+dx,h+t,z+dz)]=B.LOG;
     }
    }
   }else if(h>sea+1&&h<(this.genVersion>=4?105:40)&&(!g3||d[I(x,h,z)])&&x>2&&x<13&&z>2&&z<13&&hash(wx,wz,this.seed+99)<.012){
    for(let t=1;t<=5;t++)d[I(x,h+t,z)]=B.LOG;
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=3;dy<=6;dy++)if(!(Math.abs(dx)==2&&Math.abs(dz)==2)&&!d[I(x+dx,h+dy,z+dz)])d[I(x+dx,h+dy,z+dz)]=B.LEAVES
   }}
  for(const [k,v] of this.mods){const [mx,my,mz]=k.split(',').map(Number);if(Math.floor(mx/S)===cx&&Math.floor(mz/S)===cz)d[I(mx-cx*S,my,mz-cz*S)]=v}
  return d}
 get(x,y,z){if(y<0||y>=H)return 0;const c=this.chunks.get(this.key(Math.floor(x/S),Math.floor(z/S)));if(!c)return 0;return c.d[((y*S)+(z-c.cz*S))*S+(x-c.cx*S)]}
 set(x,y,z,id){if(y<0||y>=H)return;const cx=Math.floor(x/S),cz=Math.floor(z/S),c=this.chunks.get(this.key(cx,cz));if(!c)return;
  c.d[((y*S)+(z-cz*S))*S+(x-cx*S)]=id;this.mods.set(x+','+y+','+z,id);this.dirty.add(c);
  const key=x+','+y+','+z;if(isWater(id)){if(id===B.WATER)this.flowDistance.set(key,0);if(!this.fluidSeen.has(key)){this.fluidQueue.push([x,y,z]);this.fluidSeen.add(key)}}
  if(id===0){for(const [dx,dy,dz] of [[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]]){const nx=x+dx,ny=y+dy,nz=z+dz;if(isWater(this.get(nx,ny,nz))){const nk=nx+','+ny+','+nz;if(!this.fluidSeen.has(nk)){this.fluidQueue.push([nx,ny,nz]);this.fluidSeen.add(nk)}}}}
  const lx=x-cx*S,lz=z-cz*S;for(const [dx,dz,t] of [[-1,0,lx===0],[1,0,lx===S-1],[0,-1,lz===0],[0,1,lz===S-1]])if(t){const n=this.chunks.get(this.key(cx+dx,cz+dz));if(n)this.dirty.add(n)}}
 mesh(c){for(const m of c.meshes)this.scene.remove(m),m.geometry.dispose();c.meshes=[];const ores=[];const out=[{p:[],u:[],c:[],i:[]},{p:[],u:[],c:[],i:[]}];
  for(let y=0;y<H;y++)for(let z=0;z<S;z++)for(let x=0;x<S;x++){const id=c.d[(y*S+z)*S+x];if(!id)continue;if(id>=16&&id<=19)ores.push(c.cx*S+x,y,c.cz*S+z,id);const wat=isWater(id),o=out[wat?1:0],wx=c.cx*S+x,wz=c.cz*S+z;
   for(const [d,cs,sh] of F){const n=this.get(wx+d[0],y+d[1],wz+d[2]);if(!see(n)||(n===id&&id!==7&&id!==B.AUTUMN_LEAVES)||(wat&&isWater(n)))continue;
    const b=o.p.length/3,T=wat?0:id,N=wat?1:NT,u0=T/N,u1=(T+1)/N;cs.forEach((q,k)=>{o.p.push(wx+q[0],y+q[1],wz+q[2]);o.u.push(k===0||k===3?u0:u1,k<2?0:1);{const v=wat?.88+sh*.12:sh;o.c.push(v,v,v)}});o.i.push(b,b+1,b+2,b,b+2,b+3)}}
  out.forEach((o,k)=>{if(!o.p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(o.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(o.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(o.c,3));g.setIndex(o.i);
   const m=new THREE.Mesh(g,k?this.wmat:this.mat);if(k)m.renderOrder=2;this.scene.add(m);c.meshes.push(m)});c.ores=ores;this.buildXray(c)}
 update(px,pz,rd){const pcx=Math.floor(px/S),pcz=Math.floor(pz/S);let made=0;
  for(let r=0;r<=rd&&made<2;r++)for(let dx=-r;dx<=r&&made<2;dx++)for(let dz=-r;dz<=r&&made<2;dz++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const k=this.key(pcx+dx,pcz+dz);
    if(!this.chunks.has(k)){const c={cx:pcx+dx,cz:pcz+dz,meshes:[]};c.d=this.gen(c.cx,c.cz);this.chunks.set(k,c);this.dirty.add(c);for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=this.chunks.get(this.key(c.cx+a,c.cz+b));if(n)this.dirty.add(n)}made++}}
  let m=0;for(const c of [...this.dirty]){this.mesh(c);this.dirty.delete(c);if(++m>=2)break}
  for(const [k,c] of this.chunks)if(Math.max(Math.abs(c.cx-pcx),Math.abs(c.cz-pcz))>rd+2){this.clearX(c);for(const q of c.meshes)this.scene.remove(q),q.geometry.dispose();this.chunks.delete(k);this.dirty.delete(c)}}
 stepWater(limit=10){let done=0;while(this.fluidQueue.length&&done<limit){const [x,y,z]=this.fluidQueue.shift(),key=x+','+y+','+z;this.fluidSeen.delete(key);const id=this.get(x,y,z);if(!isWater(id)){done++;continue}
   const dist=this.flowDistance.get(key)??(id===B.WATER?0:4);
   // Gravity has priority. Flowing water falls freely, then spreads a short distance sideways.
   if(y>1&&this.get(x,y-1,z)===B.AIR){this.set(x,y-1,z,B.FLOWING_WATER);this.flowDistance.set(x+','+(y-1)+','+z,dist);done++;continue}
   if(dist<4){for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(this.get(nx,y,nz)===B.AIR){this.set(nx,y,nz,B.FLOWING_WATER);this.flowDistance.set(nx+','+y+','+nz,dist+1)}}}
   done++;
  }}
 surface(x,z){for(let y=H-1;y>0;y--)if(this.get(x,y,z))return y+1;return 40}
 ground(x,z){for(let y=H-1;y>0;y--)if(solid(this.get(x,y,z)))return y+1;return 40}
}
