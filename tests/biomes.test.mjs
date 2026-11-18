import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const root=path.resolve(import.meta.dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dig-biomes-'));
fs.writeFileSync(path.join(tmp,'three.mjs'),'');
let worldSource=fs.readFileSync(path.join(root,'js/world.js'),'utf8').replace("from 'three'","from './three.mjs'");
fs.writeFileSync(path.join(tmp,'world.mjs'),worldSource);
let itemSource=fs.readFileSync(path.join(root,'js/items.js'),'utf8').replace("from './world.js'","from './world.mjs'");
fs.writeFileSync(path.join(tmp,'items.mjs'),itemSource);
const W=await import(pathToFileURL(path.join(tmp,'world.mjs')));
const liveHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
const biomeSource=fs.readFileSync(path.join(root,'js/biome-finder.js'),'utf8');
const scriptStart=liveHtml.indexOf('<script type="module">'),scriptEnd=liveHtml.indexOf('</script>',scriptStart);
assert.ok(scriptStart>=0&&scriptEnd>scriptStart,'live game module script must exist');
const liveScriptPath=path.join(tmp,'live-game.mjs');
fs.writeFileSync(liveScriptPath,liveHtml.slice(scriptStart+'<script type="module">'.length,scriptEnd));
const syntax=spawnSync(process.execPath,['--check',liveScriptPath],{encoding:'utf8'});
assert.equal(syntax.status,0,'live game module must parse: '+syntax.stderr);
assert.ok(liveHtml.includes('FARMLAND:39')&&liveHtml.includes('WHEAT_3:42'),'farming blocks must be registered');
assert.ok(liveHtml.includes('function farmingTick')&&liveHtml.includes('MAT.WHEAT_SEEDS'),'crop growth and seed handling must exist');
assert.ok(liveHtml.includes('function powerCircuit')&&liveHtml.includes('B.LAMP_ON'),'engineering circuits must exist');
assert.ok(liveHtml.includes('function cartTick')&&liveHtml.includes('MAT.MINECART'),'minecart transport must exist');
assert.ok(liveHtml.includes('function tunnelAt')&&liveHtml.includes('function caveNode'),'generation 7 caves must use connected chamber-and-tunnel networks');
assert.ok(liveHtml.includes('depth<=48')&&liveHtml.includes('h(7711)>.34'),'generation 7 must create shafts that reach the surface and connect deeper');
assert.ok(liveHtml.includes('const NT=56,S=16,H=192'),'the live world must retain the expanded vertical depth');
assert.ok(!liveHtml.includes('const leftLeg=new THREE.Group(),rightLeg=new THREE.Group()'),'first-person feet must not be rendered');
assert.ok(liveHtml.includes('const waterTop=inRiver?Math.min(sea,h+4):sea'),'river channels must fill to their surrounding bank height');
assert.ok(liveHtml.includes("(inRiver||biome==='Ocean'||biome==='Beach and Coast'||h<=sea+1)"),'riverbeds and ocean floors must use sand');
assert.ok(biomeSource.includes('riverField>=.016')&&biomeSource.includes('>.48')&&biomeSource.includes('>.90'),'generation 7 rivers must be narrower and less frequent');
assert.ok(liveHtml.includes("document.addEventListener('keydown',e=>{if(e.code!=='KeyE'||!playing||e.repeat)return;")&&liveHtml.includes("invUI.open('inv')"),'E must open the inventory through the capture-phase keyboard handler');
assert.ok(liveHtml.includes("biome!=='Ocean'&&!inRiver"),'trees must not spawn in oceans or rivers');



const I=await import(pathToFileURL(path.join(tmp,'items.mjs')));

const names=Object.values(W.BIOME).filter(n=>n!==W.BIOME.OCEAN),seen=new Set();
for(let x=-12000;x<=12000;x+=733){
  for(let z=-12000;z<=12000;z+=911){
    const biome=W.biomeAt(1234,x,z,5);
    assert.ok(names.includes(biome),'unknown biome: '+biome);
    assert.equal(biome,W.biomeAt(1234,x,z,5),'biome selection must be deterministic');
    const h=W.heightAt(1234,x,z,5);
    assert.ok(Number.isFinite(h)&&h>=30&&h<=174,'invalid biome terrain height: '+h);
    seen.add(biome);
  }
}
assert.deepEqual([...seen].sort(),[...names].sort(),'all ten biomes must appear in the deterministic test region');
assert.equal(W.biomeAt(1234,500,500,4),W.BIOME.FOREST,'older generation versions must retain legacy biome classification');
const seen6=new Set();let riverCells=0;for(let x=-24000;x<=24000;x+=1301)for(let z=-24000;z<=24000;z+=1609){const biome=W.biomeAt(1234,x,z,6),h=W.heightAt(1234,x,z,6);assert.ok(Object.values(W.BIOME).includes(biome),'unknown Stage 14 biome: '+biome);assert.ok(Number.isFinite(h)&&h>=10&&h<=174,'invalid Stage 14 terrain height: '+h);seen6.add(biome);if(W.riverAt(1234,x,z))riverCells++}assert.deepEqual([...seen6].sort(),Object.values(W.BIOME).sort(),'all Stage 14 biomes, including Ocean, must appear');assert.ok(riverCells>0,'Stage 14 must generate river paths');
const seen7=new Set();let riverStrengthSeen=false;
for(let x=-30000;x<=30000;x+=1499)for(let z=-30000;z<=30000;z+=1777){
 const biome=W.biomeAt(4321,x,z,7),h=W.heightAt(4321,x,z,7);
 assert.ok(Object.values(W.BIOME).includes(biome),'unknown generation 7 biome: '+biome);
 assert.ok(Number.isFinite(h)&&h>=10&&h<=174,'invalid generation 7 terrain height: '+h);
 seen7.add(biome);
 const rs=W.riverStrength(4321,x,z);assert.ok(rs>=0&&rs<=1,'river strength must be normalized');if(rs>0)riverStrengthSeen=true;
}
assert.deepEqual([...seen7].sort(),Object.values(W.BIOME).sort(),'generation 7 must contain every biome');
assert.ok(riverStrengthSeen,'generation 7 must contain smoothly blended river channels');
assert.equal(W.surfaceCaveCap(90),78,'caves must remain at least twelve blocks below the surface except at designed entrances');
for(const id of [W.B.CACTUS,W.B.AUTUMN_LEAVES,W.B.MUSHROOM_CAP,W.B.MUSHROOM_STEM,W.B.REEDS,W.B.BIRCH_LOG,W.B.BIRCH_PLANKS,W.B.PINE_LOG,W.B.PINE_PLANKS,W.B.JUNGLE_LOG,W.B.JUNGLE_PLANKS,W.B.ACACIA_LOG,W.B.ACACIA_PLANKS,W.B.MANGROVE_LOG,W.B.MANGROVE_PLANKS,W.B.MUD]){
  assert.ok(W.INFO[id],'missing block information for '+id);
  assert.ok(I.allItems().includes(id),'new biome block missing from inventory item registry: '+id);
}
console.log('PASS all ten Stage 9 biomes are deterministic and present');
console.log('PASS Stage 14 ocean, larger biomes, river paths and terrain heights are deterministic and in bounds');
console.log('PASS generation 7 rivers use sand beds, consistent narrow channels and reduced frequency');
console.log('PASS generation 7 cave entrances extend from the surface into deeper cave networks');
console.log('PASS biome terrain heights stay within world bounds');
console.log('PASS legacy generation classification is unchanged');
console.log('PASS all five new vegetation blocks are registered and inventory-accessible');
