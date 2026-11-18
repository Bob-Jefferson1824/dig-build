import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BIOMES,biomeAt,biomeHeight,findNearestBiome,bearingLabel} from '../js/biome-finder.js';
test('Stage 14 biome climate is deterministic and covers all eleven biomes',()=>{const seen=new Set();for(let z=-18000;z<=18000;z+=240)for(let x=-18000;x<=18000;x+=240){const a=biomeAt(12345,x,z,6);assert.equal(a,biomeAt(12345,x,z,6));seen.add(a);const h=biomeHeight(12345,x,z,38,174,6);assert.ok(Number.isFinite(h)&&h>=10&&h<=174)}assert.deepEqual([...seen].sort(),[...BIOMES].sort())});
test('Stage 9 biome classification remains compatible with older generation',()=>{const seen=new Set();for(let z=-12000;z<=12000;z+=80)for(let x=-12000;x<=12000;x+=80)seen.add(biomeAt(12345,x,z,5));assert.equal(seen.size,10)});
test('legacy worlds remain Forest',()=>{for(let gen=1;gen<5;gen++)assert.equal(biomeAt(42,100,200,gen),'Forest')});
test('nearest biome search returns a matching location',()=>{const hit=findNearestBiome(12345,0,0,'Desert',5,1024,16);assert.ok(hit);assert.equal(biomeAt(12345,hit.x,hit.z),'Desert')});
test('compass labels cardinal directions',()=>{assert.equal(bearingLabel(0,-1),'N');assert.equal(bearingLabel(1,0),'E');assert.equal(bearingLabel(0,1),'S');assert.equal(bearingLabel(-1,0),'W')});

test('live index module parses after its browser import is removed',()=>{const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);assert.ok(match,'index.html must contain its live module script');const source=match[1].replace(/^\s*import .*?;\s*/m,'').replace(/\bexport\s+(?=(const|let|function|class)\b)/g,'');const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;assert.doesNotThrow(()=>new AsyncFunction(source));});
