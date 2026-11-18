import {BIOME,biomeAt} from './world.js';

const COLORS={
  [BIOME.FOREST]:'#4d963e',[BIOME.DESERT]:'#d9bd70',[BIOME.JUNGLE]:'#24734b',
  [BIOME.SNOWY_MOUNTAINS]:'#dce8f2',[BIOME.SWAMP]:'#647d45',[BIOME.PLAINS]:'#9ab85b',
  [BIOME.AUTUMN_FOREST]:'#c56c32',[BIOME.TAIGA]:'#477b78',[BIOME.BEACH]:'#e8d99a',
  [BIOME.MUSHROOM_FIELDS]:'#a66a9e'
};
const names=Object.values(BIOME);

export function createBiomeFinder({getWorld,getPlayer,getMode,getWorldKey,getPlaying=()=>true,toast,onOpen=()=>{},onClose=()=>{}}){
  const style=document.createElement('style');
  style.textContent=`
  #biomeToggle{position:fixed;top:43px;right:8px;z-index:8;background:#18271f;color:#fff;border:1px solid #9aaa9d;border-radius:4px;padding:7px 10px;font:12px monospace;cursor:pointer;display:none}
  #biomeToggle:hover,#biomePanel button:hover{border-color:#ffe08a}
  #biomePanel{position:fixed;top:82px;right:8px;z-index:8;width:min(340px,calc(100vw - 24px));max-height:calc(100vh - 100px);overflow:auto;box-sizing:border-box;background:#101b18f2;color:#fff;border:2px solid #718779;border-radius:6px;padding:12px;font:12px/1.5 monospace;box-shadow:0 8px 28px #000b;display:none}
  #biomePanel .bfHead{display:flex;justify-content:space-between;align-items:center;font-weight:bold;letter-spacing:2px;font-size:14px;margin-bottom:8px}
  #biomePanel button,#biomePanel select{background:#263b30;color:#fff;border:1px solid #82988a;border-radius:3px;padding:6px;font:12px monospace}
  #biomePanel button{cursor:pointer}
  #biomePanel .bfClose{font-size:17px;line-height:1;padding:3px 8px}
  #biomePanel .bfCurrent{background:#1d3025;border:1px solid #66836d;padding:8px;border-radius:4px;margin-bottom:9px}
  #biomePanel .bfCurrent strong{display:block;font-size:17px;color:#c8f0a8}
  #biomePanel .bfSection{font-weight:bold;letter-spacing:1px;margin:10px 0 5px;color:#d8e7dc}
  #biomePanel .bfList{display:grid;grid-template-columns:1fr 1fr;gap:4px}
  #biomePanel .bfBiome{padding:4px 6px;background:#1b2921;border-radius:3px;display:flex;align-items:center;gap:6px}
  #biomePanel .bfDot{width:10px;height:10px;border-radius:2px;flex:none}
  #biomePanel .bfLocked{opacity:.42}
  #biomePanel .bfMap{width:100%;height:auto;image-rendering:pixelated;border:1px solid #65786a;background:#18251d;display:block}
  #biomePanel .bfControls{display:flex;gap:5px;margin-top:6px}
  #biomePanel .bfControls select{min-width:0;flex:1}
  #biomePanel .bfCompass{display:flex;align-items:center;gap:10px;background:#1b2921;border:1px solid #455b4a;border-radius:4px;padding:8px;margin-top:7px}
  #biomePanel .bfArrow{font-size:28px;color:#ffe08a;display:inline-block;line-height:1;transform-origin:center}
  #biomePanel .bfHint{opacity:.72;font-size:11px;margin-top:5px}
  `;
  document.head.appendChild(style);

  const toggle=document.createElement('button');
  toggle.id='biomeToggle';toggle.type='button';toggle.textContent='BIOME FINDER [B]';
  document.body.appendChild(toggle);
  const panel=document.createElement('section');
  panel.id='biomePanel';
  panel.innerHTML=`
    <div class="bfHead"><span>BIOME FINDER</span><button class="bfClose" type="button" aria-label="Close">×</button></div>
    <div class="bfCurrent">CURRENT BIOME<strong id="bfCurrent">Loading...</strong><span id="bfCoords"></span></div>
    <div class="bfSection">DISCOVERED BIOMES <span id="bfCount"></span></div>
    <div class="bfList" id="bfList"></div>
    <div class="bfSection">NEARBY BIOME MAP</div>
    <canvas class="bfMap" id="bfMap" width="260" height="260"></canvas>
    <div class="bfHint">Each square shows the biome around you. Centre square = your position. Map updates as you travel.</div>
    <div class="bfSection">BIOME COMPASS</div>
    <div class="bfControls"><select id="bfSelect" aria-label="Choose biome"></select><button id="bfFind" type="button">FIND</button></div>
    <div class="bfCompass"><span class="bfArrow" id="bfArrow">↑</span><span id="bfDirection">Choose a biome and press FIND.</span></div>
    <div class="bfHint" id="bfHint">Visit a biome to add it to your discoveries.</div>
  `;
  document.body.appendChild(panel);
  const $=id=>panel.querySelector('#'+id);
  $('bfSelect').innerHTML=names.map(n=>`<option value="${n}">${n}</option>`).join('');
  let opened=false,lastUpdate=0,lastMap=0,worldKey='',discovered=new Set(),target=null,searchToken=0;
  const memory=new Map();
  function saveDiscovery(){
    const list=[...discovered];
    memory.set(worldKey,list);
    try{localStorage.setItem('digbuild:biomes:'+worldKey,JSON.stringify(list))}catch(e){}
  }
  function loadDiscovery(key){
    worldKey=key||'unknown-world';let list=memory.get(worldKey)||[];
    try{const raw=localStorage.getItem('digbuild:biomes:'+worldKey);if(raw)list=JSON.parse(raw)}catch(e){}
    discovered=new Set(Array.isArray(list)?list.filter(n=>names.includes(n)):[]);
    target=null;searchToken++;
  }
  function drawList(){
    $('bfCount').textContent='('+discovered.size+'/10)';
    $('bfList').innerHTML=names.map(n=>`<div class="bfBiome ${discovered.has(n)?'':'bfLocked'}"><span class="bfDot" style="background:${COLORS[n]}"></span><span>${discovered.has(n)?n:'???'}</span></div>`).join('');
  }
  function drawMap(w,p){
    const c=$('bfMap'),g=c.getContext('2d'),size=20,half=6,step=64;
    for(let dz=-half;dz<=half;dz++)for(let dx=-half;dx<=half;dx++){
      const biome=biomeAt(w.seed,Math.floor(p.x)+dx*step,Math.floor(p.z)+dz*step,w.genVersion);
      g.fillStyle=COLORS[biome]||'#555';g.fillRect((dx+half)*size,(dz+half)*size,size,size);
      if(dx===0&&dz===0){g.strokeStyle='#fff';g.lineWidth=3;g.strokeRect(1,1,size-2,size-2);g.fillStyle='#fff';g.fillRect(half*size+8,half*size+8,4,4)}
      else {g.strokeStyle='#0003';g.lineWidth=1;g.strokeRect((dx+half)*size,(dz+half)*size,size,size)}
    }
  }
  function update(){
    const w=getWorld(),p=getPlayer(),mode=getMode();
    const allowed=!!w&&!!p&&getPlaying()&&(mode==='creative'||mode==='spectator');
    toggle.style.display=allowed?'block':'none';
    if(!allowed){if(opened)close();return}
    const key=getWorldKey();
    if(key!==worldKey)loadDiscovery(key);
    const now=performance.now();
    if(now-lastUpdate<450)return;lastUpdate=now;
    const current=biomeAt(w.seed,Math.floor(p.x),Math.floor(p.z),w.genVersion);
    if(!discovered.has(current)){discovered.add(current);saveDiscovery();drawList();if(current===BIOME.MUSHROOM_FIELDS)toast('Rare biome discovered: Mushroom Fields!');else toast('New biome discovered: '+current)}
    $('bfCurrent').textContent=current;
    $('bfCoords').textContent='X '+(p.x|0)+' · Y '+(p.y|0)+' · Z '+(p.z|0);
    if(opened&&now-lastMap>1100){drawMap(w,p);lastMap=now}
    if(target&&target.biome===current){$('bfDirection').textContent='You have reached '+target.biome+'!';target=null}
  }
  function open(){opened=true;panel.style.display='block';onOpen();drawList();lastMap=0;update()}
  function close(){if(!opened)return;opened=false;panel.style.display='none';onClose()}
  function togglePanel(){if(opened)close();else open()}
  toggle.addEventListener('click',togglePanel);
  panel.querySelector('.bfClose').addEventListener('click',close);
  window.addEventListener('keydown',e=>{
    if(e.code!=='KeyB'||!getWorld()||!getPlaying())return;
    if(document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
    if(getMode()!=='creative'&&getMode()!=='spectator')return;
    e.preventDefault();togglePanel();
  });
  $('bfFind').addEventListener('click',()=>{
    const w=getWorld(),p=getPlayer(),biome=$('bfSelect').value;
    if(!w||w.genVersion<5){$('bfHint').textContent='This older world does not contain the new biomes. Create a new world to use the biome compass.';return}
    $('bfHint').textContent='Searching nearby terrain for '+biome+'...';
    target=null;const token=++searchToken,step=64,maxRing=100;
    let ring=1,found=null;
    const scan=()=>{
      if(token!==searchToken||getWorld()!==w)return;
      for(let dz=-ring;dz<=ring&&!found;dz++)for(let dx=-ring;dx<=ring&&!found;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dz))!==ring)continue;
        const x=Math.floor(p.x)+dx*step,z=Math.floor(p.z)+dz*step;
        if(biomeAt(w.seed,x,z,w.genVersion)===biome)found={x,z,biome};
      }
      if(found){
        target=found;const dx=found.x-p.x,dz=found.z-p.z,dist=Math.hypot(dx,dz);
        $('bfArrow').style.transform='rotate('+Math.atan2(dx,-dz)*180/Math.PI+'deg)';
        $('bfDirection').textContent=Math.round(dist)+' blocks away · '+(dx>0?'East':dx<0?'West':'')+(dx&&dz?' / ':'')+(dz>0?'South':dz<0?'North':'');
        $('bfHint').textContent='Compass points towards the nearest sampled area of '+biome+'.';
      }else if(ring<maxRing){ring++;setTimeout(scan,0)}
      else $('bfHint').textContent='No '+biome+' found within '+(maxRing*step)+' blocks. Try searching again farther away.';
    };
    scan();
  });
  return {update,close,isOpen:()=>opened};
}
