import {biomeAt,biomeHeight,riverAt,riverStrength} from './biome-finder.js';

export const STRUCTURES=[
 {id:'abandoned-hut',name:'Abandoned Hut',rarity:'Common'},
 {id:'watchtower',name:'Watchtower',rarity:'Uncommon'},
 {id:'campsite',name:'Campsite',rarity:'Common'},
 {id:'well',name:'Well',rarity:'Common'},
 {id:'blacksmith',name:'Blacksmith',rarity:'Uncommon'},
 {id:'windmill',name:'Windmill',rarity:'Rare'},
 {id:'bridge',name:'Bridge',rarity:'Uncommon'},
 {id:'ruined-temple',name:'Ruined Temple',rarity:'Very rare'},
 {id:'village',name:'Village',rarity:'Very rare'},
 {id:'abandoned-mine',name:'Abandoned Mine',rarity:'Rare'},
 {id:'castle',name:'Castle',rarity:'Extremely rare'},
 {id:'desert-pyramid',name:'Desert Pyramid',rarity:'Very rare'}
];
const CELL=192,S=16,SEA=38;
const B={AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,SNOW:5,LOG:6,LEAVES:7,WATER:8,PLANKS:9,COBBLE:11,WORKBENCH:15,FURNACE:20,STONE_BRICKS:21,MOSSY_COBBLE:22,BIRCH_LOG:28,BIRCH_PLANKS:29,PINE_LOG:30,PINE_PLANKS:31,JUNGLE_LOG:32,JUNGLE_PLANKS:33,ACACIA_LOG:34,ACACIA_PLANKS:35,MANGROVE_LOG:36,MANGROVE_PLANKS:37,RAIL:54,POWERED_RAIL:55};
function hash(x,z,s){let h=(Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(s,982451653))|0;h=Math.imul(h^(h>>>13),1274126177)|0;return((h^(h>>>16))>>>0)/4294967295}
const floor=Math.floor;
function height(seed,x,z,gen){return biomeHeight(seed,x,z,SEA,180,gen)}
function woodFor(b){return b==='Taiga'||b==='Snowy Mountains'?[B.PINE_LOG,B.PINE_PLANKS]:b==='Jungle'?[B.JUNGLE_LOG,B.JUNGLE_PLANKS]:b==='Desert'||b==='Autumn Forest'?[B.ACACIA_LOG,B.ACACIA_PLANKS]:b==='Swamp'?[B.MANGROVE_LOG,B.MANGROVE_PLANKS]:[B.LOG,B.PLANKS]}
const allowed={
 'abandoned-hut':['Forest','Plains','Taiga','Autumn Forest'],
 watchtower:['Plains','Forest','Taiga','Snowy Mountains'],
 campsite:['Forest','Taiga','Plains','Beach and Coast','Autumn Forest'],
 well:['Plains','Desert'],
 blacksmith:['Plains','Forest','Desert','Taiga'],
 windmill:['Plains','Autumn Forest'],
 bridge:['Forest','Plains','Taiga','Jungle','Swamp','Autumn Forest'],
 'ruined-temple':['Jungle','Forest','Mushroom Fields'],
 village:['Plains','Forest','Taiga','Desert'],
 'abandoned-mine':['Snowy Mountains','Forest','Taiga','Desert'],
 castle:['Plains','Snowy Mountains','Taiga'],
 'desert-pyramid':['Desert']
};
const radius={ 'abandoned-hut':5,watchtower:6,campsite:6,well:4,blacksmith:8,windmill:9,bridge:10,'ruined-temple':12,village:25,'abandoned-mine':8,castle:29,'desert-pyramid':15};
function typeFor(r){
 if(r<.10)return 'campsite';if(r<.18)return 'abandoned-hut';if(r<.22)return 'well';if(r<.26)return 'watchtower';
 if(r<.29)return 'blacksmith';if(r<.31)return 'windmill';if(r<.35)return 'bridge';if(r<.37)return 'ruined-temple';
 if(r<.39)return 'abandoned-mine';if(r<.395)return 'village';if(r<.398)return 'castle';if(r<.403)return 'desert-pyramid';return null;
}
function siteFor(seed,gen,x,z,type,biome){
 if(!type||!allowed[type]?.includes(biome))return null;
 if(biome==='Ocean'||biome==='Beach and Coast'&&type!=='campsite'&&type!=='bridge')return null;
 if(type==='bridge'){
  if(!riverAt(seed,x,z,gen))return null;
  const alongX=Array.from({length:9},(_,i)=>riverStrength(seed,x+(i-4)*2,z)).filter(v=>v>.45).length;
  const alongZ=Array.from({length:9},(_,i)=>riverStrength(seed,x,z+(i-4)*2)).filter(v=>v>.45).length;
  if(Math.max(alongX,alongZ)<2)return null;
  const orient=alongX>=alongZ?'z':'x';
  const bankHeights=orient==='z'?[height(seed,x,z-10,gen),height(seed,x,z+10,gen)]:[height(seed,x-10,z,gen),height(seed,x+10,z,gen)];
  if(Math.abs(bankHeights[0]-bankHeights[1])>5||Math.max(...bankHeights)<SEA+1)return null;
  return {base:Math.round((bankHeights[0]+bankHeights[1])/2),orient};
 }
 const r=radius[type],samples=[];for(let dx=-r;dx<=r;dx+=Math.max(3,Math.floor(r/3)))for(let dz=-r;dz<=r;dz+=Math.max(3,Math.floor(r/3)))samples.push(height(seed,x+dx,z+dz,gen));
 const lo=Math.min(...samples),hi=Math.max(...samples),base=gen>=12?Math.floor(height(seed,x,z,gen)):Math.round(samples.reduce((a,b)=>a+b,0)/samples.length);
 const maxSlope=type==='village'||type==='castle'?7:type==='desert-pyramid'?6:5;
 if(hi-lo>maxSlope||base<SEA+2||base>155)return null;
 return {base,orient:'z'};
}
function candidate(seed,gen,gx,gz){
 const roll=hash(gx,gz,seed+2041),type=typeFor(roll);if(!type)return null;
 const x=gx*CELL+28+Math.floor(hash(gx,gz,seed+2042)*136),z=gz*CELL+28+Math.floor(hash(gx,gz,seed+2043)*136);
 const biome=biomeAt(seed,x,z,gen),site=siteFor(seed,gen,x,z,type,biome);if(!site)return null;
 const rank=hash(gx,gz,seed+2044),r=radius[type];
 // Nearby candidates compete deterministically so large buildings never overlap smaller ones.
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const ox=gx+dx,oz=gz+dz,otherRoll=hash(ox,oz,seed+2041),otherType=typeFor(otherRoll);if(!otherType)continue;
  const oxp=ox*CELL+28+Math.floor(hash(ox,oz,seed+2042)*136),ozp=oz*CELL+28+Math.floor(hash(ox,oz,seed+2043)*136),or=radius[otherType];
  if(Math.hypot(x-oxp,z-ozp)<r+or+8&&hash(ox,oz,seed+2044)<rank)return null;
 }
 return {id:type,name:STRUCTURES.find(s=>s.id===type).name,x,z,base:site.base,biome,orient:site.orient,cellX:gx,cellZ:gz};
}
function makeBuilder(c,seed){
 const out=[],map=new Map(),{x,z,base,id,biome}=c,[log,plank]=woodFor(biome);
 const put=(dx,dy,dz,b)=>{if(base+dy<1||base+dy>=190)return;map.set((dx+64)+','+dy+','+(dz+64),{x:x+dx,y:base+dy,z:z+dz,id:b})};
 const box=(x1,y1,z1,x2,y2,z2,b)=>{for(let xx=x1;xx<=x2;xx++)for(let yy=y1;yy<=y2;yy++)for(let zz=z1;zz<=z2;zz++)put(xx,yy,zz,b)};
 const shell=(w,d,h,wall,roof=plank)=>{const a=-Math.floor(w/2),b=-Math.floor(d/2);box(a,0,b,a+w-1,0,b+d-1,plank);for(let y=1;y<=h;y++)for(let xx=a;xx<a+w;xx++)for(let zz=b;zz<b+d;zz++)if(xx===a||xx===a+w-1||zz===b||zz===b+d-1)put(xx,y,zz,wall);
  box(a,h+1,b,a+w-1,h+1,b+d-1,roof);};
 const house=(ox,oz,w=7,d=7,wall=log,roof=plank)=>{const a=ox-Math.floor(w/2),b=oz-Math.floor(d/2);box(a,0,b,a+w-1,0,b+d-1,plank);for(let y=1;y<=3;y++)for(let xx=a;xx<a+w;xx++)for(let zz=b;zz<b+d;zz++)if(xx===a||xx===a+w-1||zz===b||zz===b+d-1){if(!(y===1&&xx===ox&&zz===b+d-1))put(xx,y,zz,wall)}
  for(let y=4;y<=5;y++){const inset=y-3;for(let xx=a+inset;xx<=a+w-1-inset;xx++){put(xx,y,b+inset,roof);put(xx,y,b+d-1-inset,roof)}for(let zz=b+inset;zz<=b+d-1-inset;zz++){put(a+inset,y,zz,roof);put(a+w-1-inset,y,zz,roof)}}put(ox,1,b+d-1,0);put(ox,2,b+d-1,0);};
 const tower=(ox,oz,h=15,wall=B.COBBLE)=>{for(let y=0;y<=h;y++)for(let xx=-3;xx<=3;xx++)for(let zz=-3;zz<=3;zz++)if(Math.abs(xx)===3||Math.abs(zz)===3)put(ox+xx,y,oz+zz,wall);box(ox-2,h-1,oz-2,ox+2,h-1,oz+2,plank);for(let y=1;y<h-1;y+=4)put(ox,y,oz,0);box(ox-4,h+1,oz-4,ox+4,h+1,oz+4,wall)};
 if(id==='abandoned-hut'){house(0,0,7,7,log,plank);for(let i=0;i<4;i++)put(-3+i,5,0,0);put(2,1,2,B.WORKBENCH);put(-2,1,-2,B.COBBLE)}
 if(id==='watchtower'){tower(0,0,17,B.COBBLE);for(let y=3;y<14;y+=4){put(0,y,-3,0);put(0,y,3,0)}}
 if(id==='campsite'){for(let i=-2;i<=2;i++){put(i,0,0,B.COBBLE);put(i,1,0,B.COBBLE)}for(let y=1;y<=3;y++){const half=3-y;for(let dx=-half;dx<=half;dx++)put(dx,y,3,plank);for(let dz=-half;dz<=half;dz++)put(-3,y,dz,plank)}put(0,1,-2,log);put(1,1,-2,log);put(0,2,-2,log)}
 if(id==='well'){box(-2,0,-2,2,0,2,B.COBBLE);for(let xx=-2;xx<=2;xx++)for(let zz=-2;zz<=2;zz++)if(Math.abs(xx)===2||Math.abs(zz)===2)put(xx,1,zz,B.COBBLE);box(-1,1,-1,1,1,1,B.WATER);for(const xx of [-2,2])for(const zz of [-2,2]){put(xx,2,zz,log);put(xx,3,zz,log)}box(-2,4,-2,2,4,2,plank)}
 if(id==='blacksmith'){house(0,0,11,9,log,B.COBBLE);for(let xx=-4;xx<=4;xx++)put(xx,5,-4,B.COBBLE);put(-3,1,0,B.FURNACE);put(3,1,0,B.WORKBENCH);put(0,1,2,B.COBBLE);put(1,1,2,B.COBBLE)}
 if(id==='windmill'){tower(0,0,14,B.COBBLE);put(0,15,0,log);for(let k=-5;k<=5;k++)if(k!==0){put(k,15,0,plank);put(0,15,k,plank)}put(0,16,0,log);put(0,17,0,log)}
 if(id==='bridge'){const along=c.orient==='z';for(let i=-7;i<=7;i++)for(let w=-2;w<=2;w++){const dx=along?w:i,dz=along?i:w;put(dx,0,dz,plank);if(Math.abs(w)===2&&i%3===0)put(dx,1,dz,log)}}
 if(id==='ruined-temple'){for(let xx=-9;xx<=9;xx++)for(let zz=-9;zz<=9;zz++)if(Math.abs(xx)===9||Math.abs(zz)===9){if(hash(xx,zz,seed+401)>.22)put(xx,0,zz,B.MOSSY_COBBLE);if(hash(xx,zz,seed+402)>.42)put(xx,1,zz,B.MOSSY_COBBLE);if(Math.abs(xx)%4===0&&Math.abs(zz)%4===0)for(let y=1;y<7;y++)if(hash(xx,y+zz,seed+403)>.12)put(xx,y,zz,B.STONE_BRICKS)}box(-3,0,-3,3,0,3,B.MOSSY_COBBLE);for(let xx=-2;xx<=2;xx++)for(let zz=-2;zz<=2;zz++)if(xx*xx+zz*zz<6)put(xx,1,zz,0)}
 if(id==='village'){house(-11,-9,7,7,log,plank);house(11,-9,7,7,log,plank);house(-11,10,7,7,log,plank);house(11,10,7,7,log,plank);box(-2,0,-2,2,0,2,B.COBBLE);for(let xx=-2;xx<=2;xx++)for(let zz=-2;zz<=2;zz++)if(Math.abs(xx)===2||Math.abs(zz)===2)put(xx,1,zz,B.COBBLE);box(-1,1,-1,1,1,1,B.WATER);for(let i=-8;i<=8;i++)for(let w=-1;w<=1;w++)put(w,0,i,B.COBBLE);put(0,0,0,B.COBBLE)}
 if(id==='abandoned-mine'){for(let i=0;i<30;i++){const dx=Math.round(Math.sin(i*.16)*i*.12),dz=-i,dy=-Math.floor(i*.52),floorY=dy;for(let xx=-1;xx<=1;xx++)for(let yy=1;yy<=3;yy++)put(dx+xx,floorY+yy,dz,0);put(dx,floorY,dz,B.RAIL);if(i%4===0){put(dx-2,floorY+1,dz,log);put(dx+2,floorY+1,dz,log);put(dx-2,floorY+2,dz,log);put(dx+2,floorY+2,dz,log);for(let xx=-2;xx<=2;xx++)put(dx+xx,floorY+4,dz,log)}}}
 if(id==='castle'){box(-22,0,-22,22,0,22,B.STONE_BRICKS);for(let i=-22;i<=22;i++)for(const side of [-22,22])for(let y=1;y<=9;y++)put(i,y,side,B.STONE_BRICKS);for(let i=-21;i<=21;i++)for(const side of [-22,22])put(i,10,side,B.COBBLE);for(let i=-21;i<=21;i++)for(const side of [-22,22]){put(side,10,i,B.COBBLE);for(let y=1;y<=9;y++)put(side,y,i,B.STONE_BRICKS)}for(const [xx,zz] of [[-22,-22],[22,-22],[-22,22],[22,22]])tower(xx,zz,14,B.STONE_BRICKS);house(0,0,15,15,B.STONE_BRICKS,B.COBBLE)}
 if(id==='desert-pyramid'){for(let y=0;y<10;y++){const half=12-y;for(let xx=-half;xx<=half;xx++)for(let zz=-half;zz<=half;zz++)if(Math.abs(xx)===half||Math.abs(zz)===half)put(xx,y,zz,B.SAND)}for(let y=1;y<8;y++)for(let xx=-2;xx<=2;xx++)for(let zz=-2;zz<=2;zz++)put(xx,y,zz,0);box(-3,-1,-3,3,-1,3,B.COBBLE);box(-2,-1,-2,2,-1,2,0)}
 return [...map.values()];
}
export function structureForCell(seed,gen,gx,gz){if(gen<11)return null;return candidate(seed,gen,gx,gz)}
export function structuresNear(seed,gen,x,z,radiusBlocks=512){
 const minX=floor((x-radiusBlocks)/CELL),maxX=floor((x+radiusBlocks)/CELL),minZ=floor((z-radiusBlocks)/CELL),maxZ=floor((z+radiusBlocks)/CELL),out=[];
 for(let gz=minZ;gz<=maxZ;gz++)for(let gx=minX;gx<=maxX;gx++){const c=structureForCell(seed,gen,gx,gz);if(c&&Math.hypot(c.x-x,c.z-z)<=radiusBlocks)out.push(c)}
 return out.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z));
}
export function findNearestStructure(seed,gen,x,z,target,radiusBlocks=8192){
 return structuresNear(seed,gen,x,z,radiusBlocks).filter(c=>c.id===target).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0]||null;
}
export function structureBlocksForChunk(seed,gen,cx,cz){
 if(gen<11)return [];
 const minX=floor((cx*S-64)/CELL),maxX=floor((cx*S+S+64)/CELL),minZ=floor((cz*S-64)/CELL),maxZ=floor((cz*S+S+64)/CELL),out=[];
 for(let gz=minZ;gz<=maxZ;gz++)for(let gx=minX;gx<=maxX;gx++){const c=structureForCell(seed,gen,gx,gz);if(!c)continue;for(const b of makeBuilder(c,seed)){if(floor(b.x/S)===cx&&floor(b.z/S)===cz)out.push(b)}}
 return out;
}
