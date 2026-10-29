import {attachDumbbells,updateDumbbells,setDumbbellKg,plateSize} from '../public/movement3d/dumbbells.js';
import {applySkin,addHair} from '../public/movement3d/appearance.js';
import {cameraPresets,cameraDistance} from '../public/movement3d/camera-presets.js';
import {MOTIONS,createMotion} from '../public/movement3d/motion-library.js';import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import * as T from '../public/movement3d/assets/three.module.js';import {GLTFLoader} from '../public/movement3d/assets/GLTFLoader.js';import {createNaturalRig} from '../public/movement3d/natural-rig.js';import {createBodyFullness} from '../public/movement3d/body-fullness.js';globalThis.ProgressEvent=class{};
const root=new URL('../public/movement3d/',import.meta.url).pathname,raw=zlib.gunzipSync(Buffer.concat(Array.from({length:10},(_,i)=>fs.readFileSync(root+'assets/human-'+String(i).padStart(2,'0')+'.bin')))),g=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');const body=new T.Group();body.scale.setScalar(1.8/1.680323797);body.add(g.scene);createBodyFullness(body).setFull(true);const rig=createNaturalRig(body),report=[];

for(const hair of ['', 'A','B','C']){const mesh=addHair(body,hair);if(mesh){assert(mesh.geometry.attributes.position.array.every(Number.isFinite));mesh.parent.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}}
for(const skin of ['light','tan','deep']){applySkin(rig.meshes,skin);for(const m of rig.meshes)assert(m.userData.plainColors.every(Number.isFinite));}
addHair(body,'C');
for(const [name,meta] of Object.entries(MOTIONS).filter(([,m])=>m.db)){
 const gear=attachDumbbells(rig,body,meta.db,name,8);rig.setExercise(name);
 for(const kg of [0,2,24,60]){
  setDumbbellKg(gear,60);const fitted=new T.Box3();
  if(kg===60){for(let i=0;i<40;i++){rig.pose(i/40);updateDumbbells(gear,rig,body);fitted.union(new T.Box3().setFromObject(body,true));}fitted.expandByScalar(.08);}
  setDumbbellKg(gear,kg);let minY=Infinity,maxContactError=0;const bounds=new T.Box3();
  for(let i=0;i<64;i++){rig.pose(i/64);updateDumbbells(gear,rig,body);body.updateMatrixWorld(true);
   for(const db of gear){assert(db.visible===(kg>0));assert(db.matrixWorld.elements.every(Number.isFinite));const box=new T.Box3().setFromObject(db,true);minY=Math.min(minY,box.min.y);bounds.union(box);
    if(kg===60){assert(fitted.containsBox(box),name+' gear escapes sampled camera bounds');
     for(const preset of Object.values(cameraPresets(name)))for(const aspect of [.5,1,1.6]){
      const camera=new T.PerspectiveCamera(35,aspect,.1,40),target=fitted.getCenter(new T.Vector3()),size=fitted.getSize(new T.Vector3()),{yaw,pitch}=preset,dist=cameraDistance(size,yaw,pitch,aspect,.7);
      camera.position.copy(target).add(new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(dist));camera.lookAt(target);camera.updateMatrixWorld(true);
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1,name+' dumbbell cropped');}
     }
    }
    if(db.userData.shared){const frame=rig.getSharedGrip(),center=db.getWorldPosition(new T.Vector3());assert(center.distanceTo(frame.center)<1e-5);for(const p of frame.contacts){const offset=p.clone().sub(center);maxContactError=Math.max(maxContactError,Math.hypot(offset.y,offset.z));assert(Math.abs(offset.x)<.075,'Contact must stay on the handle');}}
   }
  }
  if(kg>0)assert(minY>-.006,name+' dumbbell enters floor: '+minY);
  assert(maxContactError<.012,name+' shared hands lose contact: '+maxContactError);report.push({name,kg,minY,maxContactError});
 }
 for(const db of gear){db.parent.remove(db);db.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
}
assert(plateSize(60).r>plateSize(24).r&&plateSize(24).r>plateSize(2).r);
console.log(JSON.stringify(report,null,2));
