import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import * as T from '../public/movement3d/assets/three.module.js';import {GLTFLoader} from '../public/movement3d/assets/GLTFLoader.js';import {createNaturalRig} from '../public/movement3d/natural-rig.js';import {createBodyFullness} from '../public/movement3d/body-fullness.js';globalThis.ProgressEvent=class{};
const root=new URL('../public/movement3d/',import.meta.url).pathname,raw=zlib.gunzipSync(Buffer.concat(Array.from({length:10},(_,i)=>fs.readFileSync(root+'assets/human-'+String(i).padStart(2,'0')+'.bin')))),g=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');const body=new T.Group();body.scale.setScalar(1.8/1.680323797);body.add(g.scene);createBodyFullness(body).setFull(true);const rig=createNaturalRig(body);for(const exercise of ['steptouch','kickclap','sidelunge']){rig.setExercise(exercise);let previous,maxStep=0,maxBend=0,minGap=Infinity;
for(let i=0;i<=240;i++){
 rig.pose(i/240);const rotations=[];
 if(exercise==='sidelunge'){
  const chest=rig.bones.Spine2.getWorldPosition(new T.Vector3()),up=rig.bones.Neck.getWorldPosition(new T.Vector3()).sub(chest).normalize(),right=up.clone().cross(new T.Vector3(0,0,1)).normalize();
  for(const h of rig.hands){
   const offset=h.end.getWorldPosition(new T.Vector3()).sub(chest),suffix=h.side==='Left'?'_l':'_r';
   assert(Math.abs(offset.dot(right)-h.s*.058)<.001,'Held hands must follow the chest');
   assert(Math.abs(offset.dot(up)-.17)<.001,'Hands must remain at chest height');
   assert(h.lower.getWorldPosition(new T.Vector3()).y<h.end.getWorldPosition(new T.Vector3()).y,'Elbows should hang below wrists');
   const index=[...rig.rest.keys()].find(b=>b.name==='index_01'+suffix),pinky=[...rig.rest.keys()].find(b=>b.name==='pinky_01'+suffix),finger=rig.rest.get(rig.bones[h.side+'HandMiddle1']).wp.clone().sub(rig.rest.get(h.end).wp).normalize();
   const normal=rig.rest.get(index).wp.clone().sub(rig.rest.get(pinky).wp).cross(finger).normalize();if(normal.dot(new T.Vector3(-h.s,0,0))<0)normal.negate();
   normal.applyQuaternion(h.end.getWorldQuaternion(new T.Quaternion()).multiply(rig.rest.get(h.end).wq.clone().invert()));
   assert(normal.dot(right.clone().multiplyScalar(-h.s))>.90,'Palms must face each other, not the viewer');
  }
 }

 for(const h of rig.hands){const wrist=h.end.getWorldPosition(new T.Vector3()),elbow=h.lower.getWorldPosition(new T.Vector3()),finger=rig.bones[h.side+'HandMiddle1'].getWorldPosition(new T.Vector3()).sub(wrist).normalize(),fore=wrist.clone().sub(elbow).normalize();maxBend=Math.max(maxBend,Math.acos(T.MathUtils.clamp(finger.dot(fore),-1,1)));for(const b of [h.upper,h.lower,h.end])rotations.push(b.getWorldQuaternion(new T.Quaternion()));}
 if(previous)for(let j=0;j<rotations.length;j++)maxStep=Math.max(maxStep,rotations[j].angleTo(previous[j]));previous=rotations;
 if(i%10===0){const chest=rig.bones.Spine2.getWorldPosition(new T.Vector3()),up=rig.bones.Neck.getWorldPosition(new T.Vector3()).sub(chest).normalize(),right=up.cross(new T.Vector3(0,0,1)).normalize();let left=Infinity,other=-Infinity;
 for(const m of rig.meshes){m.skeleton.update();const si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight;for(let v=0;v<si.count;v++){let l=0,r=0;for(let k=0;k<4;k++){const n=m.skeleton.bones[si.array[v*4+k]].name,w=sw.array[v*4+k];if(/^(hand_l|(?:thumb|index|middle|ring|pinky)_.*_l)$/.test(n))l+=w;if(/^(hand_r|(?:thumb|index|middle|ring|pinky)_.*_r)$/.test(n))r+=w;}if(l<.5&&r<.5)continue;const p=m.getVertexPosition(v,new T.Vector3()).applyMatrix4(m.matrixWorld).sub(chest).dot(right);if(l>.5)left=Math.min(left,p);if(r>.5)other=Math.max(other,p);}}
 const gap=left-other;minGap=Math.min(minGap,gap);assert(gap>=.002,'Hand surfaces must not cross: '+gap);}
}
assert(maxBend<.7,'Wrists must not bend beyond 40 degrees');assert(maxStep<.2,'No wrist or arm rotation jumps');console.log({exercise,maxBendDegrees:maxBend*180/Math.PI,maxStepDegrees:maxStep*180/Math.PI,minGap});
}
