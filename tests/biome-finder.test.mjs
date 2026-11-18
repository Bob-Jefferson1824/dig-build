import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BIOMES,biomeAt,biomeHeight,findNearestBiome,bearingLabel} from '../js/biome-finder.js';
import {STRUCTURES,structuresNear,findNearestStructure,structureBlocksForChunk} from '../js/structures.js';
test('Stage 14 biome climate is deterministic and covers all eleven biomes',()=>{const seen=new Set();for(let z=-18000;z<=18000;z+=240)for(let x=-18000;x<=18000;x+=240){const a=biomeAt(12345,x,z,6);assert.equal(a,biomeAt(12345,x,z,6));seen.add(a);const h=biomeHeight(12345,x,z,38,174,6);assert.ok(Number.isFinite(h)&&h>=10&&h<=174)}assert.deepEqual([...seen].sort(),[...BIOMES].sort())});
test('Stage 9 biome classification remains compatible with older generation',()=>{const seen=new Set();for(let z=-12000;z<=12000;z+=80)for(let x=-12000;x<=12000;x+=80)seen.add(biomeAt(12345,x,z,5));assert.ok(seen.size>=9)});
test('legacy worlds remain Forest',()=>{for(let gen=1;gen<5;gen++)assert.equal(biomeAt(42,100,200,gen),'Forest')});
test('nearest biome search returns a matching location',()=>{const hit=findNearestBiome(12345,0,0,'Desert',5,1024,16);assert.ok(hit);assert.equal(biomeAt(12345,hit.x,hit.z),'Desert')});
test('compass labels cardinal directions',()=>{assert.equal(bearingLabel(0,-1),'N');assert.equal(bearingLabel(1,0),'E');assert.equal(bearingLabel(0,1),'S');assert.equal(bearingLabel(-1,0),'W')});

test('live index module parses after its browser import is removed',()=>{const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);assert.ok(match,'index.html must contain its live module script');const source=match[1].replace(/^\s*import .*?;\s*/gm,'').replace(/\bexport\s+(?=(const|let|function|class)\b)/g,'');const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;assert.doesNotThrow(()=>new AsyncFunction(source));});

test('generation 11 biome teleport uses terrain-aware landing checks across chunk edges',()=>{const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.includes('y<H-2'));assert.ok(html.includes('r<=12'));assert.ok(!html.includes('y<62'));assert.ok(!html.includes('Math.floor(x/16)!==Math.floor(target.x/16)'))});
test('generation 11 cave entrances target a connected cave chamber',()=>{const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.includes('caveNode(nodeCellX,1,nodeCellZ,seed)'));assert.ok(html.includes('this.genVersion>=10?56:this.genVersion>=9?28:this.genVersion===8?48:20'))});

test('Stage 20 exposes twelve deterministic structures and places them at the generation 12 terrain surface',()=>{
 assert.equal(STRUCTURES.length,12);
 let hit=null,seed=12345;
 for(let z=-24;z<=24&&!hit;z++)for(let x=-24;x<=24&&!hit;x++){
  const nearby=structuresNear(seed,12,x*192,z*192,180);
  if(nearby.length)hit=nearby[0];
 }
 assert.ok(hit,'deterministic test seed should produce at least one structure');
 const again=findNearestStructure(seed,12,hit.x,hit.z,hit.id,0);
 assert.ok(again);assert.equal(again.id,hit.id);assert.equal(again.x,hit.x);assert.equal(again.z,hit.z);
 const chunk=structureBlocksForChunk(seed,12,Math.floor(hit.x/16),Math.floor(hit.z/16));
 assert.ok(chunk.length>0,'structure blocks must be generated in the anchor chunk');
 assert.equal(hit.base,Math.floor(biomeHeight(seed,hit.x,hit.z,38,180,12)),'structure base must equal the actual generation 12 terrain height');
 assert.ok(chunk.every(b=>Number.isInteger(b.x)&&Number.isInteger(b.y)&&Number.isInteger(b.z)&&Number.isInteger(b.id)));
});
test('Stage 20 structures do not appear in legacy generation 10 worlds',()=>{
 assert.equal(structuresNear(12345,10,0,0,8192).length,0);
 assert.equal(structureBlocksForChunk(12345,10,0,0).length,0);
});

test('generation 11 terrain and structure generation remain on their legacy path',()=>{const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.includes('if(gen>=12)return biomeHeight(seed,wx,wz,sea,H-12,gen);if(gen>=5)return biomeHeight(seed,wx,wz,sea,H-12);'));});
