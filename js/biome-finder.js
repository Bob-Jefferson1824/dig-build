// Deterministic Stage 9 biome climate and Stage 10 biome-finder helpers.
export const BIOMES=['Forest','Desert','Jungle','Snowy Mountains','Swamp','Plains','Autumn Forest','Taiga','Beach and Coast','Mushroom Fields','Ocean'];
function hash(x,z,s){let h=(x*374761393+z*668265263+s*982451653)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295}
const smooth=t=>t*t*(3-2*t);
function noise(x,z,s){const xi=Math.floor(x),zi=Math.floor(z),fx=smooth(x-xi),fz=smooth(z-zi),a=hash(xi,zi,s),b=hash(xi+1,zi,s),c=hash(xi,zi+1,s),d=hash(xi+1,zi+1,s);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz}
function fbm(x,z,s){return noise(x,z,s)*.55+noise(x*2,z*2,s+1)*.28+noise(x*4,z*4,s+2)*.17}
export function biomeAt(seed,x,z,gen=5){
 if(gen<5)return 'Forest';
 const scale=gen>=6?1.75:1,temperature=fbm(x/(520*scale),z/(520*scale),seed+1701),moisture=fbm(x/(390*scale),z/(390*scale),seed+2701),rare=fbm(x/(700*scale),z/(700*scale),seed+3701),coast=fbm(x/(gen>=6?900:420),z/(gen>=6?900:420),seed+91);
 const oceanLimit=gen>=8?.20:gen>=7?.23:.30,beachLimit=gen>=8?.48:.35;
 if(gen>=6&&coast<oceanLimit)return 'Ocean';
 if(rare>(gen>=7?.78:.84)&&moisture>.54&&temperature>.34&&temperature<.76)return 'Mushroom Fields';
 if(gen>=6&&coast<beachLimit)return 'Beach and Coast';
 if(temperature<.27)return 'Snowy Mountains';
 if(temperature>.69&&moisture<.39)return 'Desert';
 if(moisture>.76&&temperature>.35&&temperature<.75)return 'Swamp';
 if(temperature>.62&&moisture>.59)return 'Jungle';
 if(temperature<.43&&moisture>.43)return 'Taiga';
 if(temperature>.46&&temperature<.7&&moisture<.49)return 'Autumn Forest';
 if(moisture<.43)return 'Plains';
 return 'Forest';
}
function biomeHeightLegacy(seed,x,z,sea=25,maxHeight=52,gen=5){if(gen>=7){
 const continent=fbm(x/900,z/900,seed+91),m=Math.max(0,fbm(x/220,z/220,seed+7)-.5)*2,broad=fbm(x/145,z/145,seed),detail=fbm(x/38,z/38,seed+611),temperature=fbm(x/910,z/910,seed+1701),moisture=fbm(x/682,z/682,seed+2701);
 const band=(v,lo,hi,fade=.10)=>smooth(Math.max(0,Math.min(1,(v-lo)/fade)))*smooth(Math.max(0,Math.min(1,(hi-v)/fade)));
 if(continent<.23)return Math.max(10,sea-17+smooth(continent/.23)*16+Math.floor(fbm(x/125,z/125,seed+123)*2));
 const mountain=1-smooth(Math.max(0,Math.min(1,(temperature-.17)/.31))),desert=band(temperature,.66,1,.16)*(1-smooth(Math.max(0,Math.min(1,(moisture-.30)/.25)))),jungle=band(temperature,.56,1,.19)*smooth(Math.max(0,Math.min(1,(moisture-.48)/.28))),swamp=band(temperature,.30,.82,.18)*smooth(Math.max(0,Math.min(1,(moisture-.64)/.24))),taiga=smooth(Math.max(0,Math.min(1,(.49-temperature)/.18)))*smooth(Math.max(0,Math.min(1,(moisture-.34)/.22))),mushroom=band(temperature,.36,.76,.18)*band(moisture,.56,.90,.15)*smooth(Math.max(0,Math.min(1,(fbm(x/700,z/700,seed+3701)-.78)/.12)));
 let h=78+broad*18+m*m*22+(detail-.5)*3;h+=mountain*mountain*35;h-=desert*5;h+=jungle*7;h-=swamp*18;h+=taiga*4+mushroom*3;
 const coast=smooth(Math.max(0,Math.min(1,(continent-.23)/.13)));h=(sea-1)+(h-(sea-1))*coast;
 const wx=(fbm(x/360,z/360,seed+801)-.5)*150,wz=(fbm(x/360,z/360,seed+802)-.5)*150,riverField=fbm((x+wx)/230,(z+wz)/230,seed+803)-.5,riverMask=fbm(x/1100,z/1100,seed+804)>.42,river=riverMask?1-smooth(Math.max(0,Math.min(1,Math.abs(riverField)/.024))):0;h-=river*4.5;
 return Math.max(sea-7,Math.min(maxHeight,Math.floor(h)));
 }if(gen>=6){const continent=fbm(x/900,z/900,seed+91),m=Math.max(0,fbm(x/220,z/220,seed+7)-.5)*2,b=biomeAt(seed,x,z,gen),broad=fbm(x/105,z/105,seed),detail=fbm(x/34,z/34,seed+611),temperature=fbm(x/910,z/910,seed+1701),moisture=fbm(x/682,z/682,seed+2701);if(continent<.30)return Math.max(10,sea-15+smooth(continent/.30)*14+Math.floor(fbm(x/125,z/125,seed+123)*2));let h=78+broad*17+m*m*24+(detail-.5)*3;h+=Math.max(0,Math.min(1,(.39-temperature)/.39))**2*30;if(b==='Desert')h-=2;if(b==='Jungle')h+=3;if(b==='Swamp')h-=smooth(Math.max(0,Math.min(1,(moisture-.70)/.28)))*38;if(Math.abs(fbm((x+(fbm(x/360,z/360,seed+801)-.5)*150)/230,(z+(fbm(x/360,z/360,seed+802)-.5)*150)/230,seed+803)-.5)<.018)h-=4;const blend=smooth(Math.max(0,Math.min(1,(continent-.30)/.12)));h=(sea-1)+(h-(sea-1))*blend;return Math.max(sea-6,Math.min(maxHeight,Math.floor(h)))}const m=Math.max(0,fbm(x/220,z/220,seed+7)-.5)*2,coast=fbm(x/420,z/420,seed+91),b=biomeAt(seed,x,z,5),broad=fbm(x/70,z/70,seed),detail=fbm(x/24,z/24,seed+611);if(coast<.22)return Math.max(sea-6,Math.floor(sea-3+fbm(x/75,z/75,seed+123)*7));let h=31+broad*11+m*m*9+(detail-.5)*4;if(b==='Beach and Coast')h=sea-1+broad*3;if(b==='Desert')h=29+broad*8+(detail-.5)*3;if(b==='Plains')h=27+broad*7+(detail-.5)*3;if(b==='Swamp')h=sea-3+broad*4+(detail-.5)*2;if(b==='Jungle')h=34+broad*12+m*m*7;if(b==='Snowy Mountains')h=39+broad*12+m*m*9;if(b==='Taiga')h=34+broad*10+m*m*7;if(b==='Mushroom Fields')h=32+broad*9+(detail-.5)*4;return Math.max(sea-5,Math.min(maxHeight,Math.floor(h)))}

export function biomeHeight(seed,x,z,sea=25,maxHeight=52,gen=5){
 if(gen>=8){
 const continent=fbm(x/900,z/900,seed+91),m=Math.max(0,fbm(x/220,z/220,seed+7)-.5)*2,broad=fbm(x/145,z/145,seed),detail=fbm(x/38,z/38,seed+611),temperature=fbm(x/910,z/910,seed+1701),moisture=fbm(x/682,z/682,seed+2701);
 const band=(v,lo,hi,fade=.10)=>smooth(Math.max(0,Math.min(1,(v-lo)/fade)))*smooth(Math.max(0,Math.min(1,(hi-v)/fade)));
 if(continent<.20)return Math.max(10,sea-18+smooth(continent/.20)*17+Math.floor(fbm(x/150,z/150,seed+123)*1.5));
 const mountain=1-smooth(Math.max(0,Math.min(1,(temperature-.17)/.31))),desert=band(temperature,.66,1,.16)*(1-smooth(Math.max(0,Math.min(1,(moisture-.30)/.25)))),jungle=band(temperature,.56,1,.19)*smooth(Math.max(0,Math.min(1,(moisture-.48)/.28))),swamp=band(temperature,.30,.82,.18)*smooth(Math.max(0,Math.min(1,(moisture-.64)/.24))),taiga=smooth(Math.max(0,Math.min(1,(.49-temperature)/.18)))*smooth(Math.max(0,Math.min(1,(moisture-.34)/.22))),mushroom=band(temperature,.36,.76,.18)*band(moisture,.56,.90,.15)*smooth(Math.max(0,Math.min(1,(fbm(x/700,z/700,seed+3701)-.78)/.12)));
 let h=78+broad*18+m*m*22+(detail-.5)*3;h+=mountain*mountain*35;h-=desert*5;h+=jungle*7;h-=swamp*18;h+=taiga*4+mushroom*3;
 const coast=smooth(Math.max(0,Math.min(1,(continent-.20)/.28)));h=(sea-1)+(h-(sea-1))*coast;
 const river=riverStrength(seed,x,z);h-=river*5;
 return Math.max(sea-7,Math.min(maxHeight,Math.floor(h)));
 }
 if(gen===7)return biomeHeightLegacy(seed,x,z,sea,maxHeight,gen);
 return biomeHeightLegacy(seed,x,z,sea,maxHeight,gen);
}
export function riverStrength(seed,x,z){
 const wx=(fbm(x/360,z/360,seed+801)-.5)*150,wz=(fbm(x/360,z/360,seed+802)-.5)*150;
 const riverField=Math.abs(fbm((x+wx)/230,(z+wz)/230,seed+803)-.5);
 if(fbm(x/1100,z/1100,seed+804)<=.48||riverField>=.016)return 0;
 const t=Math.max(0,Math.min(1,1-riverField/.016));return t*t*(3-2*t);
}
export function riverAt(seed,x,z,gen=7){
 if(gen>=8)return riverStrength(seed,x,z)>.90;
 const wx=(fbm(x/360,z/360,seed+801)-.5)*150,wz=(fbm(x/360,z/360,seed+802)-.5)*150,riverField=fbm((x+wx)/230,(z+wz)/230,seed+803)-.5;
 return fbm(x/1100,z/1100,seed+804)>.42&&Math.abs(riverField)<.012;
}
export function biomeColor(name){return ({'Forest':'#397d3c','Desert':'#d7bd68','Jungle':'#176b36','Snowy Mountains':'#dcebf4','Swamp':'#536b42','Plains':'#8dbb55','Autumn Forest':'#bd6b32','Taiga':'#547b69','Beach and Coast':'#e4d59b','Mushroom Fields':'#a75b9a','Ocean':'#2364a8'})[name]||'#333'}
export function findNearestBiome(seed,x,z,target,gen=5,radius=1024,step=16){let best=null,bestD=Infinity;for(let dz=-radius;dz<=radius;dz+=step)for(let dx=-radius;dx<=radius;dx+=step){const d=dx*dx+dz*dz;if(d>=bestD*bestD)continue;if(biomeAt(seed,x+dx,z+dz,gen)===target){best={x:x+dx,z:z+dz};bestD=Math.sqrt(d)}}return best}
export function bearingLabel(dx,dz){const a=(Math.atan2(dx,-dz)*180/Math.PI+360)%360;return ['N','NE','E','SE','S','SW','W','NW'][Math.round(a/45)%8]}
