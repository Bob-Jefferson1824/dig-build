import {isTool,toolInfo,maxDur} from './items.js';
const ICONS=new Map();let ATLAS_CANVAS=null;
export function setAtlas(c){ATLAS_CANVAS=c;ICONS.clear()}
const TCOL=['#a67c46','#8a8a90','#dcdce2','#f6d23c','#52e6e6'];
const HEAD=[[[5,3],[6,2],[7,2],[8,2],[9,2],[10,3],[11,4],[12,5],[12,6],[6,3],[10,4]],[[7,2],[8,2],[9,2],[10,3],[11,4],[10,5],[9,5],[8,5],[8,4],[9,4],[9,3]],[[10,2],[11,2],[12,3],[11,3],[10,3],[11,4],[10,4],[12,4],[11,5]],[[12,1],[11,2],[10,3],[9,4],[8,5],[7,6],[6,7],[5,8],[12,2],[11,3],[10,4],[9,5],[8,6],[7,7]]];
export function iconURL(id){let u=ICONS.get(id);if(u)return u;const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const px=(x,y,col)=>{g.fillStyle=col;g.fillRect(x*2,y*2,2,2)};
 if(isTool(id)){const i=toolInfo(id),n=i.type===3?4:10;for(let k=0;k<n;k++)px(2+k,13-k,'#6b4a26');if(i.type===3){px(3,10,'#444');px(4,11,'#444');px(5,12,'#444')}for(const [x,y] of HEAD[i.type])px(x,y,TCOL[i.tier]);for(const [x,y] of HEAD[i.type].slice(0,3))px(x,y+0,'#ffffff55')}
 else if(id===104){for(const [x,y] of [[5,5],[6,5],[7,5],[8,5],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[5,7],[6,7],[7,7],[8,7],[9,7],[6,8],[7,8],[8,8]])px(x,y+1,'#26262a');for(const [x,y] of [[6,6],[7,6],[8,7]])px(x,y+1,'#555560')}
 else if(id===100){for(let k=0;k<10;k++)px(3+k,12-k,'#8a6430')}
 else if(id===101||id===102){const col=id===101?'#d8d8dc':'#f2c630';for(let y=6;y<10;y++)for(let x=3;x<13;x++)px(x,y,y===6?'#fff8':col)}
 else if(id===103){for(const [x,y] of [[8,2],[7,3],[8,3],[9,3],[6,4],[7,4],[8,4],[9,4],[10,4],[7,5],[8,5],[9,5],[8,6],[8,7],[7,6],[9,6]])px(x,y+2,'#52e6e6');px(7,5,'#d6ffff')}
 else if(ATLAS_CANVAS){g.drawImage(ATLAS_CANVAS,id*16,0,16,16,0,0,32,32);g.strokeStyle='#0008';g.strokeRect(.5,.5,31,31)}
 u=c.toDataURL();ICONS.set(id,u);return u}
export function slotHTML(s,hideCount){if(!s)return '';const t=isTool(s.id),m=maxDur(s.id);
 let h=`<img src="${iconURL(s.id)}" draggable="false">`;if(!t&&!hideCount&&s.n>1)h+=`<span class="n">${s.n}</span>`;
 if(t&&!hideCount&&s.d<m){const p=Math.max(0,s.d/m*100);h+=`<i class="bar"><b style="width:${p}%;background:hsl(${p*1.2},85%,48%)"></b></i>`}return h}
