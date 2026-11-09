import {B,INFO} from './world.js';
// ---- item registry. Blocks use their block id (1..99). Materials 100+. Tools 200+ (200 + type*10 + tier). Slots are {id,n,d?}. ----
export const MAXSTACK=64,MAT={STICK:100,IRON:101,GOLD:102,DIAMOND:103,COAL:104};
export const TYPES=['Pickaxe','Axe','Shovel','Sword'],TIERS=['Wooden','Stone','Iron','Gold','Diamond'];
export const TIER={speed:[2,3.5,5,7,8],dur:[59,131,250,32,1561]};   // gold: fast but fragile; diamond: best overall
export const toolId=(t,r)=>200+t*10+r,isTool=id=>id>=200;
export const toolInfo=id=>isTool(id)?{type:Math.floor((id-200)/10),tier:(id-200)%10}:null;
export const maxDur=id=>isTool(id)?TIER.dur[toolInfo(id).tier]:0,stackMax=id=>isTool(id)?1:MAXSTACK;
export const isBlockItem=id=>id>0&&id<100&&id!==B.WATER&&id!==B.FLOWING_WATER;
const MATN={100:'Stick',101:'Iron Ingot',102:'Gold Ingot',103:'Diamond',104:'Coal'};
export const itemName=id=>isTool(id)?TIERS[toolInfo(id).tier]+' '+TYPES[toolInfo(id).type]:MATN[id]||(INFO[id]&&INFO[id][0])||'Item';
export const allItems=()=>{const a=[];for(let i=1;i<100;i++)if(isBlockItem(i)&&INFO[i])a.push(i);a.push(100,101,102,103,104);for(let t=0;t<4;t++)for(let r=0;r<5;r++)a.push(toolId(t,r));return a};
const EFFECT=[[B.STONE,B.COBBLE,B.BRICK,B.COAL_ORE,B.IRON_ORE,B.GOLD_ORE,B.DIAMOND_ORE,B.FURNACE],[B.LOG,B.PLANKS,B.WORKBENCH],[B.DIRT,B.GRASS,B.SAND,B.SNOW],[]];
export const toolSpeed=(id,block)=>{if(!id||!isTool(id))return 1;const i=toolInfo(id);return EFFECT[i.type].includes(block)?TIER.speed[i.tier]:.8};
const DROPS={[B.GRASS]:B.DIRT,[B.STONE]:B.COBBLE,[B.COAL_ORE]:MAT.COAL,[B.DIAMOND_ORE]:MAT.DIAMOND};   // iron/gold ore drop themselves (smelt them in a furnace)
export const dropOf=b=>DROPS[b]||b;
const NEED={[B.COAL_ORE]:0,[B.IRON_ORE]:1,[B.GOLD_ORE]:2,[B.DIAMOND_ORE]:2};   // minimum pickaxe tier (0 wood .. 4 diamond)
export const needTier=b=>NEED[b];
export const canMine=(b,toolId)=>{const n=NEED[b];if(n===undefined)return true;if(!toolId||!isTool(toolId))return false;const i=toolInfo(toolId);return i.type===0&&i.tier>=n};
export const needMsg=b=>`Needs a ${TIERS[NEED[b]].toLowerCase()} pickaxe or better`;
export function describe(s){if(!s)return '';let t=itemName(s.id);if(isTool(s.id)){const i=toolInfo(s.id);t+=`\nDurability ${s.d}/${maxDur(s.id)}\nMining speed x${TIER.speed[i.tier]} on ${['stone & bricks','wood','dirt, sand & snow','(sword: for future combat)'][i.type]}`}else if(s.id===MAT.STICK)t+='\nCrafting material';else if(s.id>=100)t+='\nCrafting material';else if(s.id===B.WORKBENCH)t+='\nPlace it, then right-click to craft';else if(s.id===B.FURNACE)t+='\nPlace it, then right-click to smelt';else if(NEED[s.id]!==undefined)t+=`\nNeeds a ${TIERS[NEED[s.id]].toLowerCase()} pickaxe or better`;else if(s.id===MAT.COAL)t+='\nFurnace fuel (smelts 8 items)';else t+='\nBlock';return t}
export const newStack=(id,n=1,d)=>isTool(id)?{id,n:1,d:d==null?maxDur(id):d}:{id,n};
export const same=(a,b)=>!!a&&!!b&&a.id===b.id&&!isTool(a.id);
// ---- inventory: 36 slots, 0-8 hotbar, 9-35 backpack ----
export const newInv=()=>Array(36).fill(null);
export function addItem(inv,id,n=1,dry=false,d){if(dry)inv=inv.map(s=>s&&{...s});let left=n;const t=isTool(id);
 if(!t)for(let i=0;i<inv.length&&left>0;i++){const s=inv[i];if(s&&s.id===id&&s.n<MAXSTACK){const m=Math.min(MAXSTACK-s.n,left);s.n+=m;left-=m}}
 for(let i=0;i<inv.length&&left>0;i++)if(!inv[i]){const m=t?1:Math.min(MAXSTACK,left);inv[i]=newStack(id,m,d);left-=m}
 return left}
export const canAdd=(inv,id,n=1)=>addItem(inv,id,n,true)===0;
// Mouse click on slot arr[i] while holding `held` (cursor stack). Returns the new held stack.
export function click(arr,i,held,right){const s=arr[i];
 if(!held){if(!s)return null;if(right&&s.n>1){const h=Math.ceil(s.n/2);arr[i]={...s,n:s.n-h};return {...s,n:h}}arr[i]=null;return s}
 if(!s){if(right){arr[i]={...held,n:1};return held.n>1?{...held,n:held.n-1}:null}arr[i]=held;return null}
 if(same(s,held)){const room=stackMax(s.id)-s.n,m=right?Math.min(1,room):Math.min(room,held.n);s.n+=m;const r=held.n-m;return r>0?{...held,n:r}:null}
 arr[i]=held;return s}
export function wearTool(inv,i,creative,amt=1){const s=inv[i];if(creative||!s||!isTool(s.id))return false;s.d-=amt;if(s.d<=0){inv[i]=null;return true}return false}
// ---- recipes (modular: call addRecipe from anywhere). pat = rows of ids (0 = empty); shaped recipes match anywhere in the grid, mirrored too ----
export const RECIPES=[];
export const addRecipe=(out,n,pat,shapeless=false)=>RECIPES.push({out,n,pat,shapeless});
(function(){const L=B.LOG,PL=B.PLANKS,ST=MAT.STICK;
 addRecipe(PL,4,[[L]]);addRecipe(ST,4,[[PL],[PL]]);addRecipe(B.WORKBENCH,1,[PL,PL,PL,PL],true);
 [PL,B.COBBLE,MAT.IRON,MAT.GOLD,MAT.DIAMOND].forEach((M,t)=>{addRecipe(toolId(0,t),1,[[M,M,M],[0,ST,0],[0,ST,0]]);addRecipe(toolId(1,t),1,[[M,M],[M,ST],[0,ST]]);addRecipe(toolId(2,t),1,[[M],[ST],[ST]]);addRecipe(toolId(3,t),1,[[M],[M],[ST]])})})();
addRecipe(B.FURNACE,1,[[B.COBBLE,B.COBBLE,B.COBBLE],[B.COBBLE,0,B.COBBLE],[B.COBBLE,B.COBBLE,B.COBBLE]]);
// ---- furnace: {s:[input,fuel,output], prog, burn, burnMax}. Fuel is only burned while something is actually smelting. ----
export const SMELT={[B.IRON_ORE]:MAT.IRON,[B.GOLD_ORE]:MAT.GOLD},FUEL={[MAT.COAL]:48},SMELT_TIME=6;
export const newFurnace=()=>({s:[null,null,null],prog:0,burn:0,burnMax:0});
export function furnaceTick(f,dt){const [inp,fuel,out]=f.s,res=inp&&SMELT[inp.id],ok=res&&(!out||(out.id===res&&out.n<MAXSTACK));
 if(!ok){const had=f.prog>0;f.prog=0;return had}
 if(f.burn<=0){if(fuel&&FUEL[fuel.id]){f.burnMax=f.burn=FUEL[fuel.id];if(--fuel.n<=0)f.s[1]=null}else{const had=f.prog>0;f.prog=Math.max(0,f.prog-dt*2);return had}}
 f.burn=Math.max(0,f.burn-dt);f.prog+=dt;
 if(f.prog>=SMELT_TIME){f.prog-=SMELT_TIME;if(--inp.n<=0)f.s[0]=null;if(out)out.n++;else f.s[2]={id:res,n:1}}
 return true}
export function findRecipe(g){const rows=g.map(r=>r.some(Boolean)),r0=rows.indexOf(true);if(r0<0)return null;
 const cols=g[0].map((_,c)=>g.some(r=>r[c])),r1=rows.lastIndexOf(true),c0=cols.indexOf(true),c1=cols.lastIndexOf(true);
 const sub=g.slice(r0,r1+1).map(r=>r.slice(c0,c1+1)),flat=sub.flat().filter(Boolean).sort().join();
 for(const R of RECIPES){if(R.shapeless){if(R.pat.slice().sort().join()===flat)return R;continue}
  if(R.pat.length!==sub.length||R.pat[0].length!==sub[0].length)continue;const eq=m=>m.every((row,y)=>row.every((v,x)=>v===sub[y][x]));
  if(eq(R.pat)||eq(R.pat.map(r=>[...r].reverse())))return R}return null}
export const gridIds=(craft,n)=>Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>{const s=craft[r*3+c];return s?s.id:0}));
export function craftTake(craft,cells,creative){if(creative)return;for(const k of cells){const s=craft[k];if(s&&--s.n<=0)craft[k]=null}}

// ---- game modes: what each mode is allowed to do. main.js gates every interaction through this table. ----
export const MODES={
 survival:{mine:true,place:true,interact:true,collect:true,wear:true,inventory:true,saveWorld:true},
 creative:{mine:true,place:true,interact:true,collect:false,wear:false,inventory:true,saveWorld:true},
 spectator:{mine:false,place:false,interact:false,collect:false,wear:false,inventory:false,saveWorld:false}};
