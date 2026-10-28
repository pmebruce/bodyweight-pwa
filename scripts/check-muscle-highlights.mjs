import {MOTIONS,createMotion} from '../public/movement3d/motion-library.js';import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import * as T from '../public/movement3d/assets/three.module.js';import {GLTFLoader} from '../public/movement3d/assets/GLTFLoader.js';import {createNaturalRig} from '../public/movement3d/natural-rig.js';import {createBodyFullness} from '../public/movement3d/body-fullness.js';globalThis.ProgressEvent=class{};
const root=new URL('../public/movement3d/',import.meta.url).pathname,raw=zlib.gunzipSync(Buffer.concat(Array.from({length:10},(_,i)=>fs.readFileSync(root+'assets/human-'+String(i).padStart(2,'0')+'.bin')))),g=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');const body=new T.Group();body.scale.setScalar(1.8/1.680323797);body.add(g.scene);createBodyFullness(body).setFull(true);const rig=createNaturalRig(body),report=[];

// Check the actual vertex colours, not only the target metadata.
const close=(a,b)=>Math.abs(a-b)<1e-6;
for(const [name,meta] of Object.entries(MOTIONS)){
 assert(meta.targets.p.length>0,name+' must retain a primary target');
 const all=[...meta.targets.p,...meta.targets.s];assert(new Set(all).size===all.length,name+' duplicate target');
 rig.setExercise(name);rig.setHighlight(true);let coloured=0;
 for(const mesh of rig.meshes){
  const colors=mesh.geometry.attributes.color.array,plain=mesh.userData.plainColors,si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;
  for(let i=0;i<si.count;i++){
   const active=[0,1,2].some(k=>!close(colors[i*3+k],plain[i*3+k]));if(!active)continue;coloured++;
   const p=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);
   if(name==='steptouch')assert(p.y<1.10,'Step touch must not colour chest/arms');
   if(name==='sideleg')assert(p.y>.90&&p.y<1.07&&Math.abs(p.x)>.12,'Side leg raise must isolate outer hip muscles');
   if(name==='sidebend')assert(p.y>1.02&&p.y<1.29&&Math.abs(p.x)>.105&&p.z>-.03,'Side bend must not mark stretched lats');
   for(let k=0;k<4;k++)if(sw.array[i*4+k]>.7){const bone=mesh.skeleton.bones[si.array[i*4+k]].name;assert(!/^(head|hand_|foot_|ball_|(?:thumb|index|middle|ring|pinky)_)/.test(bone),name+' colours non-muscle extremity '+bone);}
  }
 }
 assert(coloured>0,name+' target is missing from model');report.push({name,coloured});
 rig.setHighlight(false);for(const m of rig.meshes)assert(m.geometry.attributes.color.array.every((v,i)=>close(v,m.userData.plainColors[i])),name+' toggle leaves colour behind');
}
assert(!MOTIONS.steptouch.targets.s.includes('chest'));
assert(![...MOTIONS.sidebend.targets.p,...MOTIONS.sidebend.targets.s].includes('lats'));
console.log(JSON.stringify({exercises:report.length,report},null,2));
