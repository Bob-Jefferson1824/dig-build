import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

const root=path.resolve(import.meta.dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dig-biomes-'));
fs.writeFileSync(path.join(tmp,'three.mjs'),'');
let worldSource=fs.readFileSync(path.join(root,'js/world.js'),'utf8').replace("from 'three'","from './three.mjs'");
fs.writeFileSync(path.join(tmp,'world.mjs'),worldSource);
let itemSource=fs.readFileSync(path.join(root,'js/items.js'),'utf8').replace("from './world.js'","from './world.mjs'");
fs.writeFileSync(path.join(tmp,'items.mjs'),itemSource);
const W=await import(pathToFileURL(path.join(tmp,'world.mjs')));
const I=await import(pathToFileURL(path.join(tmp,'items.mjs')));

const names=Object.values(W.BIOME),seen=new Set();
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
for(const id of [W.B.CACTUS,W.B.AUTUMN_LEAVES,W.B.MUSHROOM_CAP,W.B.MUSHROOM_STEM,W.B.REEDS]){
  assert.ok(W.INFO[id],'missing block information for '+id);
  assert.ok(I.allItems().includes(id),'new biome block missing from inventory item registry: '+id);
}
console.log('PASS all ten Stage 9 biomes are deterministic and present');
console.log('PASS biome terrain heights stay within world bounds');
console.log('PASS legacy generation classification is unchanged');
console.log('PASS all five new vegetation blocks are registered and inventory-accessible');
