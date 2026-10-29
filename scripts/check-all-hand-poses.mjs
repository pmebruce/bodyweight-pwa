import {MOTIONS,createMotion} from '../public/movement3d/motion-library.js';import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import * as T from '../public/movement3d/assets/three.module.js';import {GLTFLoader} from '../public/movement3d/assets/GLTFLoader.js';import {createNaturalRig} from '../public/movement3d/natural-rig.js';import {createBodyFullness} from '../public/movement3d/body-fullness.js';globalThis.ProgressEvent=class{};
const root=new URL('../public/movement3d/',import.meta.url).pathname,raw=zlib.gunzipSync(Buffer.concat(Array.from({length:10},(_,i)=>fs.readFileSync(root+'assets/human-'+String(i).padStart(2,'0')+'.bin')))),g=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');const body=new T.Group();body.scale.setScalar(1.8/1.680323797);body.add(g.scene);createBodyFullness(body).setFull(true);const rig=createNaturalRig(body),report=[];
for(const name of Object.keys(MOTIONS)){
 rig.setExercise(name);const motion=createMotion(name);let maxBend=0,maxStep=0,previous,fistChecks=0,contactChecks=0;
 for(let i=0;i<128;i++){
  const t=i/128;rig.pose(t);const source=motion.at(t),rotations=[];
  for(const h of rig.hands){
   const type=source['arm'+(h.side==='Left'?'N':'F')].hand,wrist=h.end.getWorldPosition(new T.Vector3()),fore=wrist.clone().sub(h.lower.getWorldPosition(new T.Vector3())).normalize(),finger=rig.bones[h.side+'HandMiddle1'].getWorldPosition(new T.Vector3()).sub(wrist).normalize(),bend=Math.acos(T.MathUtils.clamp(fore.dot(finger),-1,1));maxBend=Math.max(maxBend,bend);rotations.push(h.end.getWorldQuaternion(new T.Quaternion()));
   if(type==='fist'){
    assert(bend<(['dbgoblet','dbtricep','dbbridge','dbrenegade'].includes(name)?.66:.01),name+' wrist must align with grip');const suffix=h.side==='Left'?'_l':'_r',third=[...rig.rest.keys()].find(b=>b.name==='middle_03'+suffix),original=rig.rest.get(third).wp.distanceTo(rig.rest.get(h.end).wp);assert(third.getWorldPosition(new T.Vector3()).distanceTo(wrist)<original*.9,name+' fingers must actually close');fistChecks++;
   }
   if(type==='flat'&&wrist.y<.13){
    const suffix=h.side==='Left'?'_l':'_r',index=[...rig.rest.keys()].find(b=>b.name==='index_01'+suffix),pinky=[...rig.rest.keys()].find(b=>b.name==='pinky_01'+suffix),restFinger=rig.rest.get(rig.bones[h.side+'HandMiddle1']).wp.clone().sub(rig.rest.get(h.end).wp).normalize();let palm=rig.rest.get(index).wp.clone().sub(rig.rest.get(pinky).wp).cross(restFinger).normalize();if(palm.dot(new T.Vector3(-h.s,0,0))<0)palm.negate();palm.applyQuaternion(h.end.getWorldQuaternion(new T.Quaternion()).multiply(rig.rest.get(h.end).wq.clone().invert()));assert(palm.dot(new T.Vector3(0,-1,0))>.95,name+' palm must face floor');contactChecks++;
   }
   const bearing=type==='flat'||type==='grip';assert(bend<(bearing?1.85:.66),name+' wrist bends excessively: '+bend*180/Math.PI);
  }
  if(previous)for(let j=0;j<2;j++)maxStep=Math.max(maxStep,rotations[j].angleTo(previous[j]));previous=rotations;
  for(const mesh of rig.meshes){mesh.skeleton.update();assert(mesh.skeleton.boneMatrices.every(Number.isFinite),name+' skeleton invalid');}
 }
 assert(maxStep<Math.PI/2,name+' wrist flips suddenly');report.push({name,maxBendDegrees:maxBend*180/Math.PI,maxStepDegrees:maxStep*180/Math.PI,fistChecks,contactChecks});
}
console.log(JSON.stringify({exercises:report.length,frames:report.length*128,report},null,2));
