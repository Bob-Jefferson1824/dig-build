import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BIOMES,biomeAt,biomeHeight,findNearestBiome,bearingLabel} from '../js/biome-finder.js';
test('biome climate is deterministic and covers all ten biomes',()=>{const seen=new Set();for(let z=-5000;z<=5000;z+=80)for(let x=-5000;x<=5000;x+=80){const a=biomeAt(12345,x,z);assert.equal(a,biomeAt(12345,x,z));seen.add(a);const h=biomeHeight(12345,x,z);assert.ok(Number.isFinite(h)&&h>=19&&h<=52)}assert.deepEqual([...seen].sort(),[...BIOMES].sort())});
test('legacy worlds remain Forest',()=>{for(let gen=1;gen<5;gen++)assert.equal(biomeAt(42,100,200,gen),'Forest')});
test('nearest biome search returns a matching location',()=>{const hit=findNearestBiome(12345,0,0,'Desert',5,1024,16);assert.ok(hit);assert.equal(biomeAt(12345,hit.x,hit.z),'Desert')});
test('compass labels cardinal directions',()=>{assert.equal(bearingLabel(0,-1),'N');assert.equal(bearingLabel(1,0),'E');assert.equal(bearingLabel(0,1),'S');assert.equal(bearingLabel(-1,0),'W')});

test('live index module parses after its browser import is removed',()=>{const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');const match=html.match(/<script type=\"module\">([\\s\\S]*?)<\\/script>/);assert.ok(match,'index.html must contain its live module script');const source=match[1].replace(/^\\s*import .*?;\\s*/m,'');const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;assert.doesNotThrow(()=>new AsyncFunction(source));});
