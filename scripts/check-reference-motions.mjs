import {MOTIONS,createMotion} from '../public/movement3d/motion-library.js';import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import * as T from '../public/movement3d/assets/three.module.js';import {GLTFLoader} from '../public/movement3d/assets/GLTFLoader.js';import {createNaturalRig} from '../public/movement3d/natural-rig.js';import {createBodyFullness} from '../public/movement3d/body-fullness.js';globalThis.ProgressEvent=class{};
const root=new URL('../public/movement3d/',import.meta.url).pathname,raw=zlib.gunzipSync(Buffer.concat(Array.from({length:10},(_,i)=>fs.readFileSync(root+'assets/human-'+String(i).padStart(2,'0')+'.bin')))),g=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');const body=new T.Group();body.scale.setScalar(1.8/1.680323797);body.add(g.scene);createBodyFullness(body).setFull(true);const rig=createNaturalRig(body),report=[];

const result=[];const V=()=>new T.Vector3();
for(const name of ['dbfarmer','dbgoblet','dbrdl']){
 rig.setExercise(name);let minZ=Infinity,maxZ=-Infinity,maxSlide=0,maxStep=0,minKnee=180,maxKnee=0,prev,previousRotations;const lastStance={};
 for(let i=0;i<=720;i++){
  const t=i/720;rig.pose(t===1?0:t);const root=rig.bones.Hips.getWorldPosition(V());minZ=Math.min(minZ,root.z);maxZ=Math.max(maxZ,root.z);
  const rotations=Object.values(rig.bones).map(b=>b.getWorldQuaternion(new T.Quaternion()));if(previousRotations)for(let j=0;j<rotations.length;j++)maxStep=Math.max(maxStep,rotations[j].angleTo(previousRotations[j]));previousRotations=rotations;
  for(const f of rig.feet){
   const a=f.upper.getWorldPosition(V()),b=f.lower.getWorldPosition(V()),c=f.foot.getWorldPosition(V());const knee=180-a.clone().sub(b).angleTo(c.clone().sub(b))*180/Math.PI;minKnee=Math.min(minKnee,knee);maxKnee=Math.max(maxKnee,knee);
   if(name==='dbfarmer'){
    const cycle=t*10.8/1.8+(f.s>0?.5:0),u=cycle%1,key=Math.floor(cycle);const p=lastStance[f.side];
    if(u<.59&&p&&p.key===key){maxSlide=Math.max(maxSlide,c.distanceTo(p.point));assert(c.distanceTo(p.point)<.002,'Stance ankle slides');}
    lastStance[f.side]=u<.59?{point:c,key}:null;
   }else assert(c.distanceTo(f.target)<.002,name+' foot loses its planted target');
  }
 }
 if(name==='dbfarmer'){assert(maxZ-minZ>1.1,'Carry must advance, not march');assert(maxKnee<70,'Carry knees lift too high');}
 if(name==='dbrdl')assert(maxKnee<40,'RDL must remain a hip hinge, not a squat');
 assert(maxStep<.3,name+' joint jumps');result.push({name,minZ,maxZ,maxSlide,maxStepDegrees:maxStep*180/Math.PI,minKnee,maxKnee});
}
console.log(JSON.stringify(result,null,2));
