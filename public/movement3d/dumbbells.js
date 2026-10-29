import * as T from './assets/three.module.js';
import {normalizeKg,MAX_KG} from './weight-range.js';
// Adjustable-dumbbell meshes parented to the hand bones. Placed once in the rest pose:
// the handle runs across the palm (index → pinky knuckles) and sits in the closed fist.
/** kg per dumbbell → plate size: 2 kg small and short, 24 kg big and long (adjustable-dumbbell look) */
export function plateSize(kg=8){const u=Math.sqrt(normalizeKg(kg)/MAX_KG);return {r:.032+.036*u,len:.04+.10*u};}
function dumbbell(kg){
  const g=new T.Group(),metal=new T.MeshStandardMaterial({color:0x9aa3a8,roughness:.35,metalness:.7}),plate=new T.MeshStandardMaterial({color:0x2c3136,roughness:.6,metalness:.2});
  const {r,len}=plateSize(kg),half=.074;
  const handle=new T.Mesh(new T.CylinderGeometry(.015,.015,2*half+.01,12),metal);handle.rotation.z=Math.PI/2;g.add(handle);
  for(const s of [-1,1]){
    const head=new T.Mesh(new T.CylinderGeometry(r,r,len,8),plate);head.rotation.z=Math.PI/2;head.position.x=s*(half+len/2);g.add(head);
    const cap=new T.Mesh(new T.CylinderGeometry(.03,.03,.012,12),metal);cap.rotation.z=Math.PI/2;cap.position.x=s*(half+len+.006);g.add(cap);
  }
  g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});return g;
}
/** swap every attached dumbbell for one sized to kg (keeps its place in the hand) */
export function setDumbbellKg(list,kg){
  for(let i=0;i<list.length;i++){const old=list[i],n=dumbbell(kg);n.position.copy(old.position);n.quaternion.copy(old.quaternion);n.scale.copy(old.scale);n.userData={...old.userData};n.visible=normalizeKg(kg)>0;old.parent.add(n);old.parent.remove(old);old.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});list[i]=n;}
}
// Calibrated on a neutral-grip hang (farmer's carry pose): there the handle runs front-to-back (world Z)
// through the closed fist, palms facing in. The same hand-local offset/axis is then valid in every pose.
export function attachDumbbells(rig,model,mode,exercise,kg){
  if(!mode)return [];
  if(mode==='one'){rig.setExercise(exercise);rig.pose(0);const db=dumbbell(kg);db.userData.shared=true;db.visible=normalizeKg(kg)>0;model.add(db);outShared(db,rig,model);return [db];}
  rig.setExercise('dbfarmer');rig.pose(0);model.updateMatrixWorld(true);
  const find=n=>{let b;model.traverse(o=>{if(o.isBone&&o.name===n)b=o;});return b;},wp=b=>b.getWorldPosition(new T.Vector3()),out=[];
  for(const [sfx,s] of mode==='one'?[['_l',1]]:[['_l',1],['_r',-1]]){
    const hand=find('hand'+sfx),mid=find('middle_01'+sfx);
    const center=wp(hand).lerp(wp(mid),.9).add(new T.Vector3(-s*.012,-.015,0));
    const world=new T.Matrix4().compose(center,new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),new T.Vector3(0,0,1)),new T.Vector3(1,1,1));
    const local=hand.matrixWorld.clone().invert().multiply(world),db=dumbbell(kg);local.decompose(db.position,db.quaternion,db.scale);hand.add(db);db.visible=normalizeKg(kg)>0;out.push(db);
  }
  rig.setExercise(exercise);return out;
}

function outShared(db,rig,model){
  const frame=rig.getSharedGrip();if(!frame)return;
  model.updateMatrixWorld(true);const matrix=new T.Matrix4().compose(frame.center,new T.Quaternion(),new T.Vector3(1,1,1));
  matrix.premultiply(db.parent.matrixWorld.clone().invert());matrix.decompose(db.position,db.quaternion,db.scale);db.updateMatrixWorld(true);
}
export function updateDumbbells(list,rig,model){for(const db of list)if(db.userData.shared)outShared(db,rig,model);}
