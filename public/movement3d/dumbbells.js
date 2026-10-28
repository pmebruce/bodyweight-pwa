import * as T from './assets/three.module.js';
// Adjustable-dumbbell meshes parented to the hand bones. Placed once in the rest pose:
// the handle runs across the palm (index → pinky knuckles) and sits in the closed fist.
function dumbbell(){
  const g=new T.Group(),metal=new T.MeshStandardMaterial({color:0x9aa3a8,roughness:.35,metalness:.7}),plate=new T.MeshStandardMaterial({color:0x2c3136,roughness:.6,metalness:.2});
  const handle=new T.Mesh(new T.CylinderGeometry(.015,.015,.15,12),metal);handle.rotation.z=Math.PI/2;g.add(handle);
  for(const s of [-1,1]){
    const head=new T.Mesh(new T.CylinderGeometry(.052,.052,.085,8),plate);head.rotation.z=Math.PI/2;head.position.x=s*.117;g.add(head);
    const cap=new T.Mesh(new T.CylinderGeometry(.03,.03,.012,12),metal);cap.rotation.z=Math.PI/2;cap.position.x=s*.166;g.add(cap);
  }
  g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});return g;
}
// Calibrated on a neutral-grip hang (farmer's carry pose): there the handle runs front-to-back (world Z)
// through the closed fist, palms facing in. The same hand-local offset/axis is then valid in every pose.
export function attachDumbbells(rig,model,mode,exercise){
  if(!mode)return [];
  rig.setExercise('dbfarmer');rig.pose(0);model.updateMatrixWorld(true);
  const find=n=>{let b;model.traverse(o=>{if(o.isBone&&o.name===n)b=o;});return b;},wp=b=>b.getWorldPosition(new T.Vector3()),out=[];
  for(const [sfx,s] of mode==='one'?[['_l',1]]:[['_l',1],['_r',-1]]){
    const hand=find('hand'+sfx),mid=find('middle_01'+sfx);
    const center=wp(hand).lerp(wp(mid),.9).add(new T.Vector3(-s*.012,-.015,0));
    const world=new T.Matrix4().compose(center,new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),new T.Vector3(0,0,1)),new T.Vector3(1,1,1));
    const local=hand.matrixWorld.clone().invert().multiply(world),db=dumbbell();local.decompose(db.position,db.quaternion,db.scale);hand.add(db);out.push(db);
  }
  rig.setExercise(exercise);return out;
}
