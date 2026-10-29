import {SKINS,applySkin,addHair} from '../public/movement3d/appearance.js';
import {MOTIONS,createMotion} from '../public/movement3d/motion-library.js';import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import * as T from '../public/movement3d/assets/three.module.js';import {GLTFLoader} from '../public/movement3d/assets/GLTFLoader.js';import {createNaturalRig} from '../public/movement3d/natural-rig.js';import {createBodyFullness} from '../public/movement3d/body-fullness.js';globalThis.ProgressEvent=class{};
const root=new URL('../public/movement3d/',import.meta.url).pathname,raw=zlib.gunzipSync(Buffer.concat(Array.from({length:10},(_,i)=>fs.readFileSync(root+'assets/human-'+String(i).padStart(2,'0')+'.bin')))),g=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');const body=new T.Group();body.scale.setScalar(1.8/1.680323797);body.add(g.scene);createBodyFullness(body).setFull(true);const rig=createNaturalRig(body),report=[];

const originals=rig.meshes.map(m=>({plain:m.userData.plainColors.slice(),profiles:Object.fromEntries(Object.entries(m.userData.muscleProfiles).map(([k,a])=>[k,a.slice()]))}));let checks=0;
for(const skin of Object.keys(SKINS)){
 rig.meshes.forEach((m,i)=>{m.userData.plainColors.set(originals[i].plain);for(const [k,a] of Object.entries(originals[i].profiles))m.userData.muscleProfiles[k].set(a);});applySkin(rig.meshes,skin);
 const colour=new T.Color(SKINS[skin]);for(const m of rig.meshes)assert(Math.abs(m.userData.plainColors[0]-colour.r)<1e-5);
 for(const [name,meta] of Object.entries(MOTIONS).filter(([,m])=>m.fault)){
  rig.setExercise(name);rig.setFault(1,meta.fault.bones);rig.setHighlight(false);
  assert(rig.meshes.some(m=>m.geometry.attributes.color.array.some((v,i,a)=>i%3===0&&v===1&&Math.abs(a[i+1]-.82)<1e-5)),'Fault region must be visible');
  for(let i=0;i<16;i++){rig.pose(i/16);for(const m of rig.meshes){m.skeleton.update();assert(m.skeleton.boneMatrices.every(Number.isFinite));}checks++;}
  rig.setFault(0,null);rig.setHighlight(false);for(const m of rig.meshes)assert(m.geometry.attributes.color.array.every((v,i)=>v===m.userData.plainColors[i]),'Correct comparison must be neutral');
  rig.setHighlight(true);for(const m of rig.meshes)assert(m.geometry.attributes.color.array.every((v,i)=>v===m.userData.muscleProfiles[name][i]),'Exit fault mode must restore muscle colours');
 }
}
console.log({skins:4,faultPoses:checks});
