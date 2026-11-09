import {allItems,isTool,newStack,same,stackMax,MAXSTACK,click,findRecipe,gridIds,craftTake,addItem,describe,SMELT,FUEL,SMELT_TIME} from './items.js';
import {slotHTML} from './icons.js';
// Inventory, Workbench and Furnace screens. IS={inv[36],craft[9],held}. hooks:{mode(),change(),furnace(key),onOpen(),onClose()}
export function createInvUI(IS,hooks){
 const root=document.createElement('div');root.id='inv';root.style.display='none';document.body.appendChild(root);
 const heldEl=document.createElement('div');heldEl.id='held';document.body.appendChild(heldEl);const tip=document.createElement('div');tip.id='tip';document.body.appendChild(tip);
 let kind='inv',down=null,open=false,fur=null,acc=0;const size=()=>kind==='bench'?3:2,cells=()=>size()===3?[0,1,2,3,4,5,6,7,8]:[0,1,3,4],creative=()=>hooks.mode()==='creative';
 const recipe=()=>findRecipe(gridIds(IS.craft,size())),result=()=>{const R=recipe();return R?newStack(R.out,R.n):null};
 const sl=(a,i)=>`<div class="slot" data-a="${a}" data-i="${i}"></div>`,range=(a,b)=>Array.from({length:b-a},(_,k)=>a+k);
 const stackAt=(a,i)=>a==='i'?IS.inv[i]:a==='c'?IS.craft[i]:a==='f'?fur.s[i]:a==='r'?result():newStack(i);
 function top(){if(kind==='furnace')return `<div class="ttl">FURNACE</div><div class="crow"><div class="fcol"><div class="lbl">Input</div>${sl('f',0)}<div class="flame" title="Fuel left"><b id="fburn"></b></div>${sl('f',1)}<div class="lbl">Fuel</div></div><div class="parrow" title="Smelting progress"><b id="fprog"></b></div><div class="fcol"><div class="lbl">Output</div>${sl('f',2)}</div><div class="fhint">Smelts iron ore and gold ore.<br>Fuel: coal (1 coal = 8 items).<br>Right-click the furnace to reopen.</div></div>`;
  const n=size();return `<div class="ttl">${kind==='bench'?'WORKBENCH':'INVENTORY'}</div><div class="crow"><div class="cgrid" style="grid-template-columns:repeat(${n},var(--s))">${cells().map(i=>sl('c',i)).join('')}</div><div class="arrow">&#10140;</div>${sl('r',0)}</div>`}
 function build(){root.innerHTML=top()+`<div class="lbl">Backpack</div><div class="g9">${range(9,36).map(i=>sl('i',i)).join('')}</div><div class="lbl">Hotbar</div><div class="g9">${range(0,9).map(i=>sl('i',i)).join('')}</div>${creative()?`<div class="lbl">Creative items &mdash; click to pick up, click while holding to discard</div><div class="g9 pal">${allItems().map(i=>sl('p',i)).join('')}</div>`:''}<div class="hint">E / Esc to close &middot; left click: pick up / place / swap &middot; right click: take half / place one &middot; you can also drag</div>`;render()}
 function bars(){if(!fur)return;const b=root.querySelector('#fburn'),p=root.querySelector('#fprog');if(b)b.style.height=(fur.burnMax&&fur.burn>0?fur.burn/fur.burnMax*100:0)+'%';if(p)p.style.width=Math.min(100,fur.prog/SMELT_TIME*100)+'%'}
 function render(){for(const el of root.querySelectorAll('.slot')){const a=el.dataset.a;el.innerHTML=slotHTML(stackAt(a,+el.dataset.i),creative()&&a!=='r'&&a!=='f')}
  heldEl.innerHTML=slotHTML(IS.held,true)+(IS.held&&IS.held.n>1&&!creative()?`<span class="n">${IS.held.n}</span>`:'');bars()}
 function act(a,i,right){if(a==='p')IS.held=IS.held?null:newStack(i,isTool(i)?1:MAXSTACK);
  else if(a==='r'){const out=result();if(!out||(IS.held&&!(same(IS.held,out)&&IS.held.n+out.n<=stackMax(out.id))))return;IS.held=IS.held?{...IS.held,n:IS.held.n+out.n}:out;craftTake(IS.craft,cells(),creative())}
  else if(a==='f'){const s=fur.s;
   if(i===2){const o=s[2];if(!o)return;if(!IS.held){IS.held=o;s[2]=null}else if(same(IS.held,o)){const m=Math.min(stackMax(o.id)-IS.held.n,o.n);if(m<=0)return;IS.held={...IS.held,n:IS.held.n+m};o.n-=m;if(o.n<=0)s[2]=null}else return}   // output: take only
   else{if(IS.held&&!(i===0?SMELT[IS.held.id]:FUEL[IS.held.id]))return;IS.held=click(s,i,IS.held,right)}}                                  // input: smeltable ores only; fuel: coal only
  else IS.held=click(a==='c'?IS.craft:IS.inv,i,IS.held,right);hooks.change();render()}
 root.addEventListener('mousedown',e=>{const el=e.target.closest('.slot');if(!el)return;e.preventDefault();act(el.dataset.a,+el.dataset.i,e.button===2);down=e.button===0&&IS.held?el:null});
 root.addEventListener('contextmenu',e=>e.preventDefault());
 addEventListener('mouseup',e=>{if(!open||!down)return;const el=e.target.closest&&e.target.closest('.slot');const d=down;down=null;if(el&&el!==d&&IS.held)act(el.dataset.a,+el.dataset.i,false)});
 addEventListener('mousemove',e=>{if(!open)return;heldEl.style.left=e.clientX-20+'px';heldEl.style.top=e.clientY-20+'px';const el=e.target.closest&&e.target.closest('.slot'),s=el&&stackAt(el.dataset.a,+el.dataset.i);
  if(s){tip.textContent=describe(s);tip.style.display='block';tip.style.left=e.clientX+14+'px';tip.style.top=e.clientY+14+'px'}else tip.style.display='none'});
 function close(){if(!open)return;open=false;
  for(let k=0;k<9;k++){const s=IS.craft[k];if(s&&addItem(IS.inv,s.id,s.n,false,s.d)===0)IS.craft[k]=null}     // ingredients go back to the backpack; anything that doesn't fit stays in the grid
  if(IS.held&&!creative()){const h=IS.held,left=addItem(IS.inv,h.id,h.n,false,h.d);IS.held=left>0?{...h,n:left}:null}else if(creative())IS.held=null;
  root.style.display='none';tip.style.display='none';heldEl.style.display='none';fur=null;hooks.change();hooks.onClose()}
 // called every frame while open: keeps furnace bars / slots live while it smelts
 function tick(dt){if(!open||kind!=='furnace')return;bars();acc+=dt;if(acc>.25){acc=0;render()}}
 return {open(k,key){kind=k;fur=k==='furnace'?hooks.furnace(key):null;open=true;build();root.style.display='block';heldEl.style.display='block';hooks.onOpen()},close,tick,isOpen:()=>open,render}}
