import {isWater,solid} from './world.js';
// Player physics, kept separate from main.js so swimming / water-exit can be unit-tested.
export const WALK=4.3,SPRINT=7,SWIM_SCALE=.5,GRAV=25,JUMP=8.5,HW=.3,HGT=1.79,EYE=1.62;
const fl=Math.floor;
export function collides(w,x,y,z){for(let i=fl(x-HW);i<=fl(x+HW);i++)for(let j=fl(y);j<=fl(y+HGT);j++)for(let k=fl(z-HW);k<=fl(z+HW);k++)if(solid(w.get(i,j,k)))return true;return false}
// Lowest height (<=1.7) the player could be lifted to so the body fits just ahead (i.e. the top of the ledge in front).
export function ledgeHeight(P,w){const m=Math.hypot(P.vx,P.vz);if(m<1e-3)return null;const px=P.x+P.vx/m*.5,pz=P.z+P.vz/m*.5;for(let h=.1;h<=1.701;h+=.1)if(!collides(w,px,P.y+h,pz))return h;return null}
// inp: {fx:strafe(-1..1), fz:back(+1)/forward(-1), space, sprint, down, fly, yaw}. Returns {swim,headW}
export function stepPlayer(P,w,inp,dt){
 const fly=!!inp.fly,moving=inp.fx!==0||inp.fz!==0;
 const feetW=isWater(w.get(fl(P.x),fl(P.y+.2),fl(P.z))),bodyW=isWater(w.get(fl(P.x),fl(P.y+.9),fl(P.z))),headW=isWater(w.get(fl(P.x),fl(P.y+EYE),fl(P.z)));
 const swim=!fly&&(feetW||bodyW);
 let sp=(inp.sprint?SPRINT:WALK)*(fly?2:1);if(swim)sp=WALK*SWIM_SCALE;   // swimming is always slower than walking
 const l=Math.hypot(inp.fx,inp.fz)||1,fx=inp.fx/l,fz=inp.fz/l,c=Math.cos(inp.yaw),s=Math.sin(inp.yaw);
 P.vx=(fx*c+fz*s)*sp;P.vz=(-fx*s+fz*c)*sp;P.leap=Math.max(0,(P.leap||0)-dt);
 if(fly)P.vy=((inp.space?1:0)-(inp.sprint?1:0))*sp;
 else if(swim){
  if(P.leap>0)P.vy-=GRAV*dt;                                           // after a leap/climb: normal gravity so we can clear the edge
  else if(inp.space&&P.ground&&!headW){P.vy=JUMP;P.leap=.3}            // wading in shallows: ordinary jump
  else{const target=inp.space?3.6:inp.down?-3:-1.6;P.vy+=(target-P.vy)*Math.min(1,8*dt)}  // buoyancy: swim up / sink gently
 }else{P.vy-=GRAV*dt;if(inp.space&&P.ground)P.vy=JUMP}
 // Water exit / climb assist: pushing into a ledge we can reach (top within 1.7 blocks of our feet) lifts us over it: Space, or simply swimming into it.
 if(!fly&&P.blocked&&((inp.space&&(swim||P.leap>0))||(moving&&swim))){const h=ledgeHeight(P,w);if(h!==null){P.vy=Math.max(P.vy,Math.sqrt(2*GRAV*(h+.15)));P.leap=.5}}
 P.ground=false;P.blocked=false;
 for(const [a,v] of [['x',P.vx],['y',P.vy],['z',P.vz]]){const o=P[a];P[a]+=v*dt;if(collides(w,P.x,P.y,P.z)){P[a]=o;if(a==='y'){if(P.vy<0)P.ground=true;P.vy=0}else P.blocked=true}}
 if(P.y<-20){P.y=w.ground(fl(P.x),fl(P.z))+1;P.vy=0}
 return {swim,headW}}

// Spectator: free flight. No gravity, no collision (passes through every block), no water drag. Smoothly accelerates to SPEC_SPEED.
export const SPEC_SPEED=16;
export function stepSpectator(P,inp,dt){const l=Math.hypot(inp.fx,inp.fz)||1,fx=inp.fx/l,fz=inp.fz/l,c=Math.cos(inp.yaw),s=Math.sin(inp.yaw),k=Math.min(1,10*dt);
 const tx=(fx*c+fz*s)*SPEC_SPEED,tz=(-fx*s+fz*c)*SPEC_SPEED,ty=((inp.up?1:0)-(inp.down?1:0))*SPEC_SPEED*.75;
 P.vx+=(tx-P.vx)*k;P.vy+=(ty-P.vy)*k;P.vz+=(tz-P.vz)*k;P.x+=P.vx*dt;P.y=Math.max(-8,Math.min(110,P.y+P.vy*dt));P.z+=P.vz*dt;P.ground=false;P.blocked=false;P.leap=0;return {swim:false}}
